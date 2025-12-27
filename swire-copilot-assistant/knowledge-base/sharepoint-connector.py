"""
SharePoint Connector for Swire Intelligence Assistant
Handles document synchronization from SharePoint Online to Azure Cognitive Search
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

import aiohttp
from azure.identity.aio import DefaultAzureCredential
from microsoft.graph import GraphServiceClient
from microsoft.graph.generated.models.drive_item import DriveItem
from microsoft.graph.generated.models.site import Site
from azure.storage.blob.aio import BlobServiceClient

from document_processor import DocumentProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SharePointConnector:
    """Connects to SharePoint Online and syncs documents to knowledge base"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.graph_client = None
        self.blob_client = None
        self.document_processor = None
        self.credential = None
        
    async def initialize(self):
        """Initialize Microsoft Graph and Azure clients"""
        try:
            # Initialize Azure credential
            self.credential = DefaultAzureCredential()
            
            # Initialize Graph client
            self.graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            # Initialize Blob Storage client
            self.blob_client = BlobServiceClient(
                account_url=f"https://{self.config['storage_account']}.blob.core.windows.net",
                credential=self.credential
            )
            
            # Initialize document processor
            self.document_processor = DocumentProcessor(self.config)
            await self.document_processor.initialize()
            
            logger.info("Successfully initialized SharePoint connector")
            
        except Exception as e:
            logger.error(f"Failed to initialize SharePoint connector: {str(e)}")
            raise

    async def sync_sharepoint_sites(self, site_urls: List[str]) -> Dict[str, Any]:
        """Sync documents from multiple SharePoint sites"""
        results = {
            "sites_processed": 0,
            "documents_synced": 0,
            "documents_failed": 0,
            "errors": []
        }
        
        for site_url in site_urls:
            try:
                logger.info(f"Processing SharePoint site: {site_url}")
                site_result = await self._sync_single_site(site_url)
                
                results["sites_processed"] += 1
                results["documents_synced"] += site_result["synced"]
                results["documents_failed"] += site_result["failed"]
                results["errors"].extend(site_result["errors"])
                
            except Exception as e:
                logger.error(f"Failed to process site {site_url}: {str(e)}")
                results["errors"].append({
                    "site": site_url,
                    "error": str(e)
                })
        
        return results

    async def _sync_single_site(self, site_url: str) -> Dict[str, Any]:
        """Sync documents from a single SharePoint site"""
        try:
            # Get site information
            site = await self._get_site_by_url(site_url)
            if not site:
                raise Exception(f"Site not found: {site_url}")
            
            # Get document libraries
            drives = await self.graph_client.sites.by_site_id(site.id).drives.get()
            
            results = {
                "synced": 0,
                "failed": 0,
                "errors": []
            }
            
            for drive in drives.value:
                if drive.drive_type == "documentLibrary":
                    logger.info(f"Processing document library: {drive.name}")
                    
                    # Get documents from library
                    documents = await self._get_documents_from_drive(site.id, drive.id)
                    
                    # Process documents
                    for doc in documents:
                        try:
                            await self._sync_document(site, drive, doc)
                            results["synced"] += 1
                        except Exception as e:
                            logger.error(f"Failed to sync document {doc.name}: {str(e)}")
                            results["failed"] += 1
                            results["errors"].append({
                                "document": doc.name,
                                "error": str(e)
                            })
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to sync site {site_url}: {str(e)}")
            raise

    async def _get_site_by_url(self, site_url: str) -> Optional[Site]:
        """Get SharePoint site by URL"""
        try:
            # Extract hostname and site path from URL
            from urllib.parse import urlparse
            parsed_url = urlparse(site_url)
            hostname = parsed_url.netloc
            site_path = parsed_url.path
            
            # Get site using Graph API
            site = await self.graph_client.sites.by_site_id(f"{hostname}:{site_path}").get()
            return site
            
        except Exception as e:
            logger.error(f"Failed to get site {site_url}: {str(e)}")
            return None

    async def _get_documents_from_drive(self, site_id: str, drive_id: str, folder_path: str = "") -> List[DriveItem]:
        """Get all documents from a SharePoint drive"""
        documents = []
        
        try:
            # Get items from root or specific folder
            if folder_path:
                items = await self.graph_client.sites.by_site_id(site_id).drives.by_drive_id(drive_id).root.item_with_path(folder_path).children.get()
            else:
                items = await self.graph_client.sites.by_site_id(site_id).drives.by_drive_id(drive_id).root.children.get()
            
            for item in items.value:
                if item.file:  # It's a file
                    # Check if it's a supported document type
                    if self._is_supported_document(item.name):
                        documents.append(item)
                elif item.folder:  # It's a folder
                    # Recursively get documents from subfolder
                    subfolder_docs = await self._get_documents_from_drive(
                        site_id, drive_id, item.name
                    )
                    documents.extend(subfolder_docs)
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to get documents from drive {drive_id}: {str(e)}")
            return []

    def _is_supported_document(self, filename: str) -> bool:
        """Check if document type is supported for processing"""
        supported_extensions = {
            '.pdf', '.docx', '.doc', '.txt', '.html', '.htm', 
            '.xml', '.json', '.csv', '.xlsx', '.xls', '.pptx', '.ppt'
        }
        
        file_extension = os.path.splitext(filename)[1].lower()
        return file_extension in supported_extensions

    async def _sync_document(self, site: Site, drive: DriveItem, document: DriveItem):
        """Sync a single document from SharePoint to blob storage and index"""
        try:
            # Check if document needs to be updated
            blob_name = self._generate_blob_name(site, drive, document)
            
            if await self._should_update_document(blob_name, document.last_modified_date_time):
                # Download document content
                content = await self._download_document_content(site.id, drive.id, document.id)
                
                # Upload to blob storage
                await self._upload_to_blob_storage(blob_name, content, document)
                
                # Process document for search index
                await self.document_processor.process_document(blob_name, "documents")
                
                logger.info(f"Successfully synced document: {document.name}")
            else:
                logger.debug(f"Document up to date, skipping: {document.name}")
                
        except Exception as e:
            logger.error(f"Failed to sync document {document.name}: {str(e)}")
            raise

    def _generate_blob_name(self, site: Site, drive: DriveItem, document: DriveItem) -> str:
        """Generate blob name for SharePoint document"""
        # Create hierarchical path: sharepoint/site-name/library-name/document-name
        site_name = site.display_name.replace(" ", "-").lower()
        library_name = drive.name.replace(" ", "-").lower()
        
        return f"sharepoint/{site_name}/{library_name}/{document.name}"

    async def _should_update_document(self, blob_name: str, last_modified: datetime) -> bool:
        """Check if document should be updated based on modification date"""
        try:
            blob_client = self.blob_client.get_blob_client(
                container="documents",
                blob=blob_name
            )
            
            async with blob_client:
                properties = await blob_client.get_blob_properties()
                blob_modified = properties.last_modified
                
                # Update if SharePoint document is newer
                return last_modified > blob_modified
                
        except Exception:
            # If blob doesn't exist or error occurs, update the document
            return True

    async def _download_document_content(self, site_id: str, drive_id: str, item_id: str) -> bytes:
        """Download document content from SharePoint"""
        try:
            # Get download URL
            download_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/items/{item_id}/content"
            
            # Get access token
            token_result = await self.credential.get_token("https://graph.microsoft.com/.default")
            
            # Download content
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token_result.token}"}
                async with session.get(download_url, headers=headers) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        raise Exception(f"Failed to download document: HTTP {response.status}")
                        
        except Exception as e:
            logger.error(f"Failed to download document content: {str(e)}")
            raise

    async def _upload_to_blob_storage(self, blob_name: str, content: bytes, document: DriveItem):
        """Upload document to Azure Blob Storage"""
        try:
            blob_client = self.blob_client.get_blob_client(
                container="documents",
                blob=blob_name
            )
            
            # Prepare metadata
            metadata = {
                "source": "SharePoint",
                "original_name": document.name,
                "size": str(len(content)),
                "last_modified": document.last_modified_date_time.isoformat() if document.last_modified_date_time else "",
                "content_type": document.file.mime_type if document.file else "application/octet-stream"
            }
            
            async with blob_client:
                await blob_client.upload_blob(
                    content,
                    overwrite=True,
                    metadata=metadata
                )
                
            logger.debug(f"Uploaded to blob storage: {blob_name}")
            
        except Exception as e:
            logger.error(f"Failed to upload to blob storage: {str(e)}")
            raise

    async def setup_webhook_subscriptions(self, site_urls: List[str]) -> Dict[str, Any]:
        """Set up webhook subscriptions for real-time document updates"""
        results = {
            "subscriptions_created": 0,
            "errors": []
        }
        
        for site_url in site_urls:
            try:
                site = await self._get_site_by_url(site_url)
                if not site:
                    continue
                
                # Create subscription for document library changes
                subscription = {
                    "changeType": "created,updated,deleted",
                    "notificationUrl": self.config.get("webhook_url"),
                    "resource": f"sites/{site.id}/lists",
                    "expirationDateTime": (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z",
                    "clientState": "swire-intelligence-assistant"
                }
                
                # Create subscription using Graph API
                created_subscription = await self.graph_client.subscriptions.post(subscription)
                
                if created_subscription:
                    results["subscriptions_created"] += 1
                    logger.info(f"Created webhook subscription for site: {site_url}")
                
            except Exception as e:
                logger.error(f"Failed to create webhook for site {site_url}: {str(e)}")
                results["errors"].append({
                    "site": site_url,
                    "error": str(e)
                })
        
        return results

    async def handle_webhook_notification(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming webhook notification from SharePoint"""
        try:
            logger.info(f"Processing webhook notification: {notification}")
            
            # Extract information from notification
            resource = notification.get("resource")
            change_type = notification.get("changeType")
            
            if not resource or not change_type:
                return {"status": "error", "message": "Invalid notification format"}
            
            # Process based on change type
            if change_type in ["created", "updated"]:
                # Document was created or updated
                await self._process_document_change(resource, change_type)
            elif change_type == "deleted":
                # Document was deleted
                await self._process_document_deletion(resource)
            
            return {"status": "success", "processed": True}
            
        except Exception as e:
            logger.error(f"Failed to handle webhook notification: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def _process_document_change(self, resource: str, change_type: str):
        """Process document creation or update from webhook"""
        try:
            # Parse resource to get site and item information
            # Resource format: sites/{site-id}/lists/{list-id}/items/{item-id}
            parts = resource.split('/')
            if len(parts) >= 6:
                site_id = parts[1]
                list_id = parts[3]
                item_id = parts[5]
                
                # Get the updated item
                item = await self.graph_client.sites.by_site_id(site_id).lists.by_list_id(list_id).items.by_list_item_id(item_id).get()
                
                if item and self._is_supported_document(item.name):
                    # Sync the document
                    site = await self.graph_client.sites.by_site_id(site_id).get()
                    drive = await self.graph_client.sites.by_site_id(site_id).drive.get()
                    
                    await self._sync_document(site, drive, item)
                    logger.info(f"Processed {change_type} for document: {item.name}")
                
        except Exception as e:
            logger.error(f"Failed to process document change: {str(e)}")

    async def _process_document_deletion(self, resource: str):
        """Process document deletion from webhook"""
        try:
            # For deletions, we need to remove from search index and blob storage
            # This requires mapping the resource to our blob naming convention
            
            # Extract document identifier from resource
            parts = resource.split('/')
            if len(parts) >= 6:
                item_id = parts[5]
                
                # Find and remove from search index
                # This is a simplified approach - in production, you'd maintain a mapping
                await self._remove_from_search_index(item_id)
                
                logger.info(f"Processed deletion for item: {item_id}")
                
        except Exception as e:
            logger.error(f"Failed to process document deletion: {str(e)}")

    async def _remove_from_search_index(self, item_id: str):
        """Remove document from search index"""
        try:
            # Search for document by item ID in metadata
            search_results = await self.document_processor.search_documents(
                query=f"metadata_sharepoint_item_id:{item_id}",
                top=1
            )
            
            if search_results:
                document_id = search_results[0]["id"]
                
                # Remove from search index
                async with self.document_processor.search_client:
                    await self.document_processor.search_client.delete_documents([{"id": document_id}])
                
                logger.info(f"Removed document from search index: {document_id}")
                
        except Exception as e:
            logger.error(f"Failed to remove from search index: {str(e)}")

    async def close(self):
        """Close all clients"""
        try:
            if self.blob_client:
                await self.blob_client.close()
            if self.document_processor:
                await self.document_processor.close()
            if self.credential:
                await self.credential.close()
        except Exception as e:
            logger.error(f"Error closing SharePoint connector: {str(e)}")


# Configuration loader
def load_sharepoint_config() -> Dict[str, Any]:
    """Load SharePoint connector configuration"""
    config = {
        "storage_account": os.getenv("STORAGE_ACCOUNT_NAME"),
        "search_endpoint": os.getenv("SEARCH_ENDPOINT"),
        "search_index": os.getenv("SEARCH_INDEX_NAME", "swire-knowledge-base"),
        "form_recognizer_endpoint": os.getenv("FORM_RECOGNIZER_ENDPOINT"),
        "openai_endpoint": os.getenv("OPENAI_ENDPOINT"),
        "openai_api_key": os.getenv("OPENAI_API_KEY"),
        "openai_api_version": os.getenv("OPENAI_API_VERSION", "2023-12-01-preview"),
        "openai_deployment": os.getenv("OPENAI_GPT4_DEPLOYMENT", "gpt-4"),
        "embedding_deployment": os.getenv("OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-ada-002"),
        "webhook_url": os.getenv("SHAREPOINT_WEBHOOK_URL"),
        "sharepoint_sites": os.getenv("SHAREPOINT_SITES", "").split(",") if os.getenv("SHAREPOINT_SITES") else []
    }
    
    return config


# Main execution for testing
async def main():
    """Main function for testing SharePoint connector"""
    config = load_sharepoint_config()
    connector = SharePointConnector(config)
    
    try:
        await connector.initialize()
        
        # Example SharePoint sites to sync
        test_sites = [
            "https://swire.sharepoint.com/sites/policies",
            "https://swire.sharepoint.com/sites/procedures",
            "https://swire.sharepoint.com/sites/hse-documents"
        ]
        
        # Sync documents from SharePoint
        if config["sharepoint_sites"]:
            result = await connector.sync_sharepoint_sites(config["sharepoint_sites"])
            print(f"Sync result: {result}")
        
        # Set up webhook subscriptions
        webhook_result = await connector.setup_webhook_subscriptions(test_sites)
        print(f"Webhook setup result: {webhook_result}")
        
    except Exception as e:
        logger.error(f"Main execution failed: {str(e)}")
    finally:
        await connector.close()


if __name__ == "__main__":
    asyncio.run(main())