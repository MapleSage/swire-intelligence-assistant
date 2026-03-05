import os
from typing import Any, Dict, List

from openai import AzureOpenAI


class AzureAgentCore:
    def __init__(self):
        self.openai_key = os.getenv("AZURE_OPENAI_KEY")
        self.openai_endpoint = os.getenv(
            "AZURE_OPENAI_ENDPOINT",
            "https://swirere-3699-resource.cognitiveservices.azure.com/",
        )
        self.search_key = os.getenv("AZURE_SEARCH_KEY")
        self.search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        self.search_index = os.getenv("AZURE_SEARCH_INDEX", "swire-operations-index")
        self.chat_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.embedding_deployment = os.getenv(
            "AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small"
        )

        if self.openai_key:
            self.client = AzureOpenAI(
                api_key=self.openai_key,
                api_version="2024-05-01-preview",
                azure_endpoint=self.openai_endpoint,
            )
        else:
            self.client = None
            print("Warning: AZURE_OPENAI_KEY not found")

        self.search_client = None
        if self.search_endpoint:
            try:
                from azure.core.credentials import AzureKeyCredential
                from azure.identity import DefaultAzureCredential
                from azure.search.documents import SearchClient

                credential = (
                    AzureKeyCredential(self.search_key)
                    if self.search_key
                    else DefaultAzureCredential()
                )
                self.search_client = SearchClient(
                    endpoint=self.search_endpoint,
                    index_name=self.search_index,
                    credential=credential,
                )
            except Exception as e:
                print(f"Warning: Azure Search init failed: {e}")

    async def process_query(self, query: str) -> Dict[str, Any]:
        if not self.client:
            return self._mock_response(query)

        try:
            context, sources = self._search_context(query)

            system_message = (
                "You are Swire Intelligence Assistant, an expert assistant for "
                "Swire Renewable. Answer with operational clarity, safety focus, and "
                "concise recommendations."
            )
            if context:
                system_message += f"\n\nRetrieved operations context:\n{context}"

            response = self.client.chat.completions.create(
                model=self.chat_deployment,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": query},
                ],
                max_tokens=800,
            )

            return {
                "response": response.choices[0].message.content,
                "tools_used": ["azure_openai"] + (["azure_search"] if sources else []),
                "intent": "search_retrieval" if sources else "direct_chat",
                "confidence": 0.95,
                "sources": sources,
            }

        except Exception as e:
            print(f"Error in process_query: {e}")
            return self._mock_response(query)

    def get_available_tools(self) -> Dict[str, bool]:
        return {
            "azure_openai": bool(self.client),
            "azure_search": bool(self.search_client),
            "mock": True,
        }

    def _search_context(self, query: str) -> tuple[str, List[str]]:
        if not self.search_client or not self.client:
            return "", []

        try:
            from azure.search.documents.models import VectorizedQuery

            embedding = self.client.embeddings.create(
                input=[query], model=self.embedding_deployment
            ).data[0].embedding

            vector_query = VectorizedQuery(
                vector=embedding,
                k_nearest_neighbors=3,
                fields="content_vector",
            )

            results = self.search_client.search(
                search_text=query,
                vector_queries=[vector_query],
                select=["title", "content", "category", "source"],
                top=3,
            )

            context_parts: List[str] = []
            sources: List[str] = []

            for result in results:
                title = result.get("title", "untitled")
                category = result.get("category", "general")
                content = result.get("content", "")
                source = result.get("source", "")

                context_parts.append(
                    f"Source: {title} ({category})\n"
                    f"Content: {content[:1000]}"
                )
                if source:
                    sources.append(source)

            return "\n\n".join(context_parts), sources
        except Exception as e:
            print(f"Search failed, falling back to direct chat: {e}")
            return "", []

    def _mock_response(self, query: str) -> Dict[str, Any]:
        query_lower = query.lower()

        if any(w in query_lower for w in ["financial", "finance", "revenue", "profit"]):
            response = (
                "Financial Summary: Revenue $486,900, Expenses $340,830, "
                "Net Profit $146,070 (30% margin)"
            )
        elif any(w in query_lower for w in ["man-hours", "hours", "hr", "employee"]):
            response = (
                "HR Summary: Total 45,000 hours this month. Top sites: "
                "Site A (12,000h), Site B (10,500h), Site C (8,200h)"
            )
        elif any(w in query_lower for w in ["safety", "ppe", "incident", "hse"]):
            response = (
                "Safety Guidelines: PPE required - Hard hats, safety glasses, "
                "high-vis vests, steel-toed boots. 3 minor incidents this month, 0 major."
            )
        else:
            response = (
                "Swire Intelligence Assistant ready. Ask about operations, "
                "safety, maintenance, HR, or finance."
            )

        return {
            "response": response,
            "tools_used": ["mock"],
            "intent": "general",
            "confidence": 0.7,
        }
