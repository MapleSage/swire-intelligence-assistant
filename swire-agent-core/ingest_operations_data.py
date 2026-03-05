import argparse
import hashlib
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List

from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SearchableField,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
    SimpleField,
    VectorSearch,
    VectorSearchProfile,
)
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI


@dataclass
class Settings:
    data_path: Path
    container_name: str
    search_index: str
    search_endpoint: str
    search_key: str | None
    openai_endpoint: str
    openai_key: str
    embedding_model: str
    embedding_dim: int
    storage_connection_string: str


SUPPORTED_TEXT_EXT = {".txt", ".md", ".json", ".csv", ".log"}
SUPPORTED_DOC_EXT = {".pdf"}


def load_settings() -> Settings:
    data_path = Path(os.getenv("DATA_PATH", "/app/enterprise-data"))
    container_name = os.getenv("AZURE_STORAGE_CONTAINER", "operations-manuals")
    search_index = os.getenv("AZURE_SEARCH_INDEX", "swire-operations-index")

    search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "")
    openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    openai_key = os.getenv("AZURE_OPENAI_KEY", "")
    storage_connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    search_key = os.getenv("AZURE_SEARCH_KEY")

    embedding_model = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    embedding_dim = int(os.getenv("AZURE_OPENAI_EMBEDDING_DIM", "1536"))

    missing = []
    if not search_endpoint:
        missing.append("AZURE_SEARCH_ENDPOINT")
    if not openai_endpoint:
        missing.append("AZURE_OPENAI_ENDPOINT")
    if not openai_key:
        missing.append("AZURE_OPENAI_KEY")
    if not storage_connection_string:
        missing.append("AZURE_STORAGE_CONNECTION_STRING")

    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    return Settings(
        data_path=data_path,
        container_name=container_name,
        search_index=search_index,
        search_endpoint=search_endpoint,
        search_key=search_key,
        openai_endpoint=openai_endpoint,
        openai_key=openai_key,
        embedding_model=embedding_model,
        embedding_dim=embedding_dim,
        storage_connection_string=storage_connection_string,
    )


def load_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix in SUPPORTED_TEXT_EXT:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        if suffix == ".json":
            try:
                parsed = json.loads(content)
                return json.dumps(parsed, indent=2)
            except json.JSONDecodeError:
                return content
        return content

    if suffix in SUPPORTED_DOC_EXT:
        import PyPDF2

        text_parts: List[str] = []
        with file_path.open("rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

    return ""


def chunk_text(text: str, chunk_size: int = 1800, overlap: int = 250) -> Iterable[str]:
    text = text.strip()
    if not text:
        return []

    chunks = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks


def create_clients(settings: Settings):
    credential = AzureKeyCredential(settings.search_key) if settings.search_key else DefaultAzureCredential()

    index_client = SearchIndexClient(
        endpoint=settings.search_endpoint,
        credential=credential,
    )
    search_client = SearchClient(
        endpoint=settings.search_endpoint,
        index_name=settings.search_index,
        credential=credential,
    )

    blob_service_client = BlobServiceClient.from_connection_string(settings.storage_connection_string)

    openai_client = AzureOpenAI(
        api_key=settings.openai_key,
        api_version="2024-05-01-preview",
        azure_endpoint=settings.openai_endpoint,
    )

    return index_client, search_client, blob_service_client, openai_client


def ensure_index(index_client: SearchIndexClient, settings: Settings) -> None:
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="title", type=SearchFieldDataType.String),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SearchableField(name="department", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SearchableField(name="category", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SearchableField(name="source", type=SearchFieldDataType.String, filterable=True),
        SimpleField(name="chunk", type=SearchFieldDataType.Int32, filterable=True, sortable=True),
        SimpleField(name="last_modified", type=SearchFieldDataType.DateTimeOffset, filterable=True, sortable=True),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=settings.embedding_dim,
            vector_search_profile_name="swire-hnsw-profile",
        ),
    ]

    vector_search = VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="swire-hnsw")],
        profiles=[
            VectorSearchProfile(
                name="swire-hnsw-profile",
                algorithm_configuration_name="swire-hnsw",
            )
        ],
    )

    semantic_search = SemanticSearch(
        configurations=[
            SemanticConfiguration(
                name="swire-semantic-config",
                prioritized_fields=SemanticPrioritizedFields(
                    title_field=SemanticField(field_name="title"),
                    content_fields=[SemanticField(field_name="content")],
                ),
            )
        ]
    )

    index = SearchIndex(
        name=settings.search_index,
        fields=fields,
        vector_search=vector_search,
        semantic_search=semantic_search,
    )

    index_client.create_or_update_index(index)


def embed_text(client: AzureOpenAI, model: str, text: str) -> List[float]:
    vector = client.embeddings.create(input=[text], model=model).data[0].embedding
    return vector


def upload_documents(
    settings: Settings,
    search_client: SearchClient,
    blob_service_client: BlobServiceClient,
    openai_client: AzureOpenAI,
) -> tuple[int, int]:
    container_client = blob_service_client.get_container_client(settings.container_name)
    if not container_client.exists():
        container_client.create_container()

    indexed = 0
    skipped = 0

    for file_path in settings.data_path.rglob("*"):
        if not file_path.is_file():
            continue

        content = load_text(file_path)
        if not content.strip():
            skipped += 1
            continue

        relative_path = file_path.relative_to(settings.data_path).as_posix()
        department = file_path.parent.name

        with file_path.open("rb") as data:
            blob_client = container_client.get_blob_client(relative_path)
            blob_client.upload_blob(data, overwrite=True)

        chunks = chunk_text(content)
        docs_batch = []
        last_modified = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)

        for idx, chunk in enumerate(chunks):
            doc_id = hashlib.sha256(f"{relative_path}:{idx}".encode("utf-8")).hexdigest()
            vector = embed_text(openai_client, settings.embedding_model, chunk)

            docs_batch.append(
                {
                    "id": doc_id,
                    "title": file_path.name,
                    "content": chunk,
                    "department": department,
                    "category": department,
                    "source": blob_client.url,
                    "chunk": idx,
                    "last_modified": last_modified.isoformat(),
                    "content_vector": vector,
                }
            )

        if docs_batch:
            search_client.merge_or_upload_documents(docs_batch)
            indexed += len(docs_batch)
            print(f"Indexed {len(docs_batch)} chunks from {relative_path}")

    return indexed, skipped


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest operations manuals into Blob + Azure AI Search")
    parser.add_argument("--create-index", action="store_true", help="Create or update the AI Search index before ingestion")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = load_settings()

    if not settings.data_path.exists():
        raise FileNotFoundError(f"DATA_PATH not found: {settings.data_path}")

    index_client, search_client, blob_service_client, openai_client = create_clients(settings)

    if args.create_index:
        ensure_index(index_client, settings)
        print(f"Index ready: {settings.search_index}")

    indexed, skipped = upload_documents(settings, search_client, blob_service_client, openai_client)
    print(f"Completed ingestion. Indexed chunks: {indexed}, skipped files: {skipped}")


if __name__ == "__main__":
    main()
