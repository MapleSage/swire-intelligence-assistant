import json
import requests
from datetime import datetime

# Azure Cognitive Search configuration (update with your endpoints)
AZURE_SEARCH_ENDPOINT = "https://ai-parvinddutta9607ai577068173144.search.windows.net"
AZURE_SEARCH_KEY = "your-search-key"  # Replace with actual key
INDEX_NAME = "swire-wind-services"

def prepare_azure_documents():
    """Prepare wind turbine services data for Azure Cognitive Search"""
    
    # Load the knowledge base
    with open('/Volumes/Macintosh HD Ext./Developer/swire/wind_turbine_services_kb_final.json', 'r') as f:
        kb_data = json.load(f)
    
    documents = []
    
    # Process each service category
    for service_type, service_data in kb_data['wind_turbine_services_comprehensive'].items():
        if isinstance(service_data, dict):
            
            # Main service document
            doc = {
                "@search.action": "mergeOrUpload",
                "id": f"wind-turbine-{service_type}",
                "title": service_type.replace('_', ' ').title(),
                "content": json.dumps(service_data, indent=2),
                "category": "wind_turbine_services",
                "service_type": service_type,
                "description": service_data.get('description', ''),
                "tags": [service_type, "wind_turbine", "renewable_energy", "swire"],
                "created_date": datetime.now().isoformat(),
                "source": "Swire Intelligence Assistant"
            }
            documents.append(doc)
            
            # Create sub-documents for detailed services
            if 'services' in service_data:
                for i, service in enumerate(service_data['services']):
                    sub_doc = {
                        "@search.action": "mergeOrUpload", 
                        "id": f"wind-turbine-{service_type}-service-{i}",
                        "title": f"{service_type.replace('_', ' ').title()} - {service}",
                        "content": service,
                        "category": "wind_turbine_services",
                        "service_type": service_type,
                        "description": service,
                        "tags": [service_type, "wind_turbine", "service_detail", "swire"],
                        "created_date": datetime.now().isoformat(),
                        "source": "Swire Intelligence Assistant"
                    }
                    documents.append(sub_doc)
    
    return documents

def save_azure_format():
    """Save documents in Azure Cognitive Search format"""
    documents = prepare_azure_documents()
    
    azure_upload_data = {
        "value": documents
    }
    
    # Save to file
    output_file = '/Volumes/Macintosh HD Ext./Developer/swire/azure_wind_services_upload.json'
    with open(output_file, 'w') as f:
        json.dump(azure_upload_data, f, indent=2)
    
    print(f"✅ Azure Cognitive Search format saved: {output_file}")
    print(f"📊 Total documents prepared: {len(documents)}")
    
    # Also create a summary file
    summary = {
        "upload_summary": {
            "total_documents": len(documents),
            "service_categories": list(set([doc['service_type'] for doc in documents])),
            "created_date": datetime.now().isoformat(),
            "azure_endpoint": AZURE_SEARCH_ENDPOINT,
            "index_name": INDEX_NAME
        }
    }
    
    summary_file = '/Volumes/Macintosh HD Ext./Developer/swire/azure_upload_summary.json'
    with open(summary_file, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"✅ Upload summary saved: {summary_file}")
    
    return output_file

if __name__ == "__main__":
    save_azure_format()