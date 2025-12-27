"""
Document Processing Service for Swire Intelligence Assistant
Handles document ingestion, processing, and indexing for Azure Cognitive Search
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
from pathlib import Path

import aiohttp
import aiofiles
from azure.storage.blob.aio import BlobServiceClient
from azure.search.documents.aio import SearchClient
from azure.search.documents.indexes.aio import SearchIndexClient
from azure.search.documents.models import VectorizedQuery
from azure.ai.formrecognizer.aio import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.identity.aio import DefaultAzureCredential
import openai
from openai import AsyncAzureOpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Processes documents for the Swire Intelligence Assistant knowledge base"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.blob_client = None
        self.search_client = None
        self.form_recognizer_client = None
        self.openai_client = None
        
    async def initialize(self):
        """Initialize Azure clients"""
        try:
            # Initialize Azure clients with managed identity
            credential = DefaultAzureCredential()
            
            # Blob Storage client
            self.blob_client = BlobServiceClient(
                account_url=f"https://{self.config['storage_account']}.blob.core.windows.net",
                credential=credential
            )
            
            # Cognitive Search client
            self.search_client = SearchClient(
                endpoint=self.config['search_endpoint'],
                index_name=self.config['search_index'],
                credential=credential
            )
            
            # Form Recognizer client
            self.form_recognizer_client = DocumentAnalysisClient(
                endpoint=self.config['form_recognizer_endpoint'],
                credential=credential
            )
            
            # Azure OpenAI client
            self.openai_client = AsyncAzureOpenAI(
                azure_endpoint=self.config['openai_endpoint'],
                api_key=self.config['openai_api_key'],
                api_version=self.config['openai_api_version']
            )
            
            logger.info("Successfully initialized all Azure clients")
            
        except Exception as e:
            logger.error(f"Failed to initialize clients: {str(e)}")
            raise

    async def process_document(self, blob_name: str, container_name: str = "documents") -> Dict[str, Any]:
        """Process a single document from blob storage"""
        try:
            logger.info(f"Processing document: {blob_name}")
            
            # Download document from blob storage
            blob_client = self.blob_client.get_blob_client(
                container=container_name, 
                blob=blob_name
            )
            
            async with blob_client:
                blob_data = await blob_client.download_blob()
                content = await blob_data.readall()
            
            # Extract text using Form Recognizer
            extracted_text = await self._extract_text_with_form_recognizer(content)
            
            # Generate metadata
            metadata = await self._generate_metadata(blob_name, extracted_text)
            
            # Create embeddings
            embeddings = await self._create_embeddings(extracted_text)
            
            # Prepare document for indexing
            document = {
                "id": self._generate_document_id(blob_name),
                "title": metadata["title"],
                "content": extracted_text,
                "source": metadata["source"],
                "department": metadata["department"],
                "documentType": metadata["document_type"],
                "lastModified": metadata["last_modified"],
                "accessLevel": metadata["access_level"],
                "tags": metadata["tags"],
                "contentVector": embeddings
            }
            
            # Index document
            await self._index_document(document)
            
            logger.info(f"Successfully processed document: {blob_name}")
            return {"status": "success", "document_id": document["id"]}
            
        except Exception as e:
            logger.error(f"Failed to process document {blob_name}: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def _extract_text_with_form_recognizer(self, content: bytes) -> str:
        """Extract text from document using Azure Form Recognizer"""
        try:
            async with self.form_recognizer_client:
                poller = await self.form_recognizer_client.begin_analyze_document(
                    "prebuilt-read", content
                )
                result = await poller.result()
            
            # Combine all text content
            extracted_text = ""
            for page in result.pages:
                for line in page.lines:
                    extracted_text += line.content + "\n"
            
            return extracted_text.strip()
            
        except Exception as e:
            logger.error(f"Form Recognizer extraction failed: {str(e)}")
            # Fallback to basic text extraction if available
            try:
                return content.decode('utf-8', errors='ignore')
            except:
                return "Unable to extract text from document"

    async def _generate_metadata(self, blob_name: str, content: str) -> Dict[str, Any]:
        """Generate metadata for the document"""
        try:
            # Extract basic info from blob name
            path_parts = Path(blob_name).parts
            file_name = Path(blob_name).stem
            file_extension = Path(blob_name).suffix.lower()
            
            # Determine department from path or content
            department = self._determine_department(blob_name, content)
            
            # Determine document type
            document_type = self._determine_document_type(file_name, content, file_extension)
            
            # Generate tags using AI
            tags = await self._generate_tags(content)
            
            # Determine access level
            access_level = self._determine_access_level(content, department)
            
            return {
                "title": file_name.replace("_", " ").replace("-", " ").title(),
                "source": "SharePoint" if "sharepoint" in blob_name.lower() else "Upload",
                "department": department,
                "document_type": document_type,
                "last_modified": datetime.utcnow().isoformat(),
                "access_level": access_level,
                "tags": tags
            }
            
        except Exception as e:
            logger.error(f"Metadata generation failed: {str(e)}")
            return self._get_default_metadata(blob_name)

    def _determine_department(self, blob_name: str, content: str) -> str:
        """Determine department based on file path and content"""
        blob_lower = blob_name.lower()
        content_lower = content.lower()
        
        # Check path-based indicators
        if any(dept in blob_lower for dept in ['finance', 'accounting', 'budget']):
            return "Finance"
        elif any(dept in blob_lower for dept in ['hse', 'safety', 'health', 'environment']):
            return "HSE"
        elif any(dept in blob_lower for dept in ['hr', 'human-resources', 'personnel']):
            return "HR"
        elif any(dept in blob_lower for dept in ['operations', 'maintenance', 'technical']):
            return "Operations"
        elif any(dept in blob_lower for dept in ['legal', 'compliance', 'governance']):
            return "Legal"
        
        # Check content-based indicators
        if any(keyword in content_lower for keyword in ['revenue', 'expense', 'budget', 'financial']):
            return "Finance"
        elif any(keyword in content_lower for keyword in ['incident', 'safety', 'environmental', 'hazard']):
            return "HSE"
        elif any(keyword in content_lower for keyword in ['employee', 'personnel', 'training', 'performance']):
            return "HR"
        elif any(keyword in content_lower for keyword in ['procedure', 'maintenance', 'operation', 'technical']):
            return "Operations"
        
        return "General"

    def _determine_document_type(self, file_name: str, content: str, extension: str) -> str:
        """Determine document type based on name, content, and extension"""
        name_lower = file_name.lower()
        content_lower = content.lower()
        
        # Check for specific document types
        if any(keyword in name_lower for keyword in ['policy', 'policies']):
            return "policy"
        elif any(keyword in name_lower for keyword in ['procedure', 'process', 'sop']):
            return "procedure"
        elif any(keyword in name_lower for keyword in ['manual', 'guide', 'handbook']):
            return "manual"
        elif any(keyword in name_lower for keyword in ['report', 'analysis', 'summary']):
            return "report"
        elif any(keyword in name_lower for keyword in ['form', 'template', 'checklist']):
            return "form"
        
        # Check content indicators
        if any(keyword in content_lower for keyword in ['policy statement', 'this policy']):
            return "policy"
        elif any(keyword in content_lower for keyword in ['step 1', 'procedure', 'instructions']):
            return "procedure"
        elif 'report' in content_lower and any(keyword in content_lower for keyword in ['summary', 'findings', 'analysis']):
            return "report"
        
        return "document"

    async def _generate_tags(self, content: str) -> List[str]:
        """Generate tags using Azure OpenAI"""
        try:
            # Truncate content for API call
            truncated_content = content[:2000] if len(content) > 2000 else content
            
            response = await self.openai_client.chat.completions.create(
                model=self.config['openai_deployment'],
                messages=[
                    {
                        "role": "system",
                        "content": "You are a document analysis assistant. Generate 3-5 relevant tags for the given document content. Return only the tags as a comma-separated list."
                    },
                    {
                        "role": "user",
                        "content": f"Generate tags for this document:\n\n{truncated_content}"
                    }
                ],
                max_tokens=100,
                temperature=0.3
            )
            
            tags_text = response.choices[0].message.content.strip()
            tags = [tag.strip() for tag in tags_text.split(',')]
            return tags[:5]  # Limit to 5 tags
            
        except Exception as e:
            logger.error(f"Tag generation failed: {str(e)}")
            return ["document", "general"]

    def _determine_access_level(self, content: str, department: str) -> str:
        """Determine access level based on content and department"""
        content_lower = content.lower()
        
        # Check for confidential indicators
        if any(keyword in content_lower for keyword in ['confidential', 'restricted', 'internal only', 'proprietary']):
            return "confidential"
        elif any(keyword in content_lower for keyword in ['sensitive', 'private', 'limited access']):
            return "restricted"
        elif department in ['Finance', 'HR', 'Legal']:
            return "restricted"
        else:
            return "public"

    async def _create_embeddings(self, text: str) -> List[float]:
        """Create embeddings for the document text"""
        try:
            # Truncate text if too long
            max_tokens = 8000  # Conservative limit for embedding model
            if len(text) > max_tokens * 4:  # Rough character to token ratio
                text = text[:max_tokens * 4]
            
            response = await self.openai_client.embeddings.create(
                model=self.config['embedding_deployment'],
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            # Return zero vector as fallback
            return [0.0] * 1536  # Standard embedding dimension

    async def _index_document(self, document: Dict[str, Any]):
        """Index document in Azure Cognitive Search"""
        try:
            async with self.search_client:
                result = await self.search_client.upload_documents([document])
                
            if result[0].succeeded:
                logger.info(f"Successfully indexed document: {document['id']}")
            else:
                logger.error(f"Failed to index document: {result[0].error_message}")
                
        except Exception as e:
            logger.error(f"Document indexing failed: {str(e)}")
            raise

    def _generate_document_id(self, blob_name: str) -> str:
        """Generate unique document ID"""
        import hashlib
        return hashlib.md5(blob_name.encode()).hexdigest()

    def _get_default_metadata(self, blob_name: str) -> Dict[str, Any]:
        """Get default metadata when generation fails"""
        return {
            "title": Path(blob_name).stem,
            "source": "Upload",
            "department": "General",
            "document_type": "document",
            "last_modified": datetime.utcnow().isoformat(),
            "access_level": "public",
            "tags": ["document"]
        }

    async def process_batch(self, blob_names: List[str], container_name: str = "documents") -> Dict[str, Any]:
        """Process multiple documents in batch"""
        results = {
            "processed": 0,
            "failed": 0,
            "errors": []
        }
        
        # Process documents concurrently with limited concurrency
        semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent processes
        
        async def process_with_semaphore(blob_name):
            async with semaphore:
                return await self.process_document(blob_name, container_name)
        
        tasks = [process_with_semaphore(blob_name) for blob_name in blob_names]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(batch_results):
            if isinstance(result, Exception):
                results["failed"] += 1
                results["errors"].append({
                    "document": blob_names[i],
                    "error": str(result)
                })
            elif result.get("status") == "success":
                results["processed"] += 1
            else:
                results["failed"] += 1
                results["errors"].append({
                    "document": blob_names[i],
                    "error": result.get("error", "Unknown error")
                })
        
        return results

    async def search_documents(self, query: str, filters: Optional[Dict[str, str]] = None, top: int = 5) -> List[Dict[str, Any]]:
        """Search documents in the knowledge base"""
        try:
            # Create vector query for semantic search
            query_embedding = await self._create_embeddings(query)
            vector_query = VectorizedQuery(
                vector=query_embedding,
                k_nearest_neighbors=top,
                fields="contentVector"
            )
            
            # Build filter expression
            filter_expr = None
            if filters:
                filter_parts = []
                for key, value in filters.items():
                    filter_parts.append(f"{key} eq '{value}'")
                filter_expr = " and ".join(filter_parts)
            
            async with self.search_client:
                results = await self.search_client.search(
                    search_text=query,
                    vector_queries=[vector_query],
                    select=["id", "title", "content", "source", "department", "documentType", "tags"],
                    top=top,
                    filter=filter_expr,
                    query_type="semantic",
                    semantic_configuration_name="swire-semantic-config"
                )
                
                documents = []
                async for result in results:
                    documents.append({
                        "id": result["id"],
                        "title": result["title"],
                        "content": result["content"][:500] + "..." if len(result["content"]) > 500 else result["content"],
                        "source": result["source"],
                        "department": result["department"],
                        "documentType": result["documentType"],
                        "tags": result["tags"],
                        "score": result.get("@search.score", 0)
                    })
                
                return documents
                
        except Exception as e:
            logger.error(f"Document search failed: {str(e)}")
            return []

    async def close(self):
        """Close all clients"""
        try:
            if self.blob_client:
                await self.blob_client.close()
            if self.search_client:
                await self.search_client.close()
            if self.form_recognizer_client:
                await self.form_recognizer_client.close()
            if self.openai_client:
                await self.openai_client.close()
        except Exception as e:
            logger.error(f"Error closing clients: {str(e)}")


# Configuration loader
def load_config() -> Dict[str, Any]:
    """Load configuration from environment variables"""
    return {
        "storage_account": os.getenv("STORAGE_ACCOUNT_NAME"),
        "search_endpoint": os.getenv("SEARCH_ENDPOINT"),
        "search_index": os.getenv("SEARCH_INDEX_NAME", "swire-knowledge-base"),
        "form_recognizer_endpoint": os.getenv("FORM_RECOGNIZER_ENDPOINT"),
        "openai_endpoint": os.getenv("OPENAI_ENDPOINT"),
        "openai_api_key": os.getenv("OPENAI_API_KEY"),
        "openai_api_version": os.getenv("OPENAI_API_VERSION", "2023-12-01-preview"),
        "openai_deployment": os.getenv("OPENAI_GPT4_DEPLOYMENT", "gpt-4"),
        "embedding_deployment": os.getenv("OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002")
    }


# Main execution for testing
async def main():
    """Main function for testing document processing"""
    config = load_config()
    processor = DocumentProcessor(config)
    
    try:
        await processor.initialize()
        
        # Example: Process a single document
        result = await processor.process_document("sample-document.pdf")
        print(f"Processing result: {result}")
        
        # Example: Search documents
        search_results = await processor.search_documents("safety procedures")
        print(f"Search results: {len(search_results)} documents found")
        
    except Exception as e:
        logger.error(f"Main execution failed: {str(e)}")
    finally:
        await processor.close()


if __name__ == "__main__":
    asyncio.run(main())