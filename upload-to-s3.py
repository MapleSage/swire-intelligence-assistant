import boto3
import json
from datetime import datetime

def upload_knowledge_base_to_s3():
    """Upload wind turbine services knowledge base to S3 bucket"""
    
    # Initialize S3 client
    try:
        s3_client = boto3.client('s3')
        bucket_name = 'swire-knowledge-base'  # Adjust bucket name as needed
        
        # Load the knowledge base
        with open('/Volumes/Macintosh HD Ext./Developer/swire/wind_turbine_services_kb_final.json', 'r') as f:
            kb_data = json.load(f)
        
        # Add metadata
        kb_data['metadata'] = {
            'created_date': datetime.now().isoformat(),
            'version': '1.0',
            'source': 'Swire Intelligence Assistant',
            'description': 'Comprehensive wind turbine services knowledge base'
        }
        
        # Upload to S3
        key = f"knowledge-base/wind-turbine-services-{datetime.now().strftime('%Y%m%d')}.json"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=json.dumps(kb_data, indent=2),
            ContentType='application/json',
            Metadata={
                'source': 'swire-intelligence-assistant',
                'category': 'wind-turbine-services',
                'version': '1.0'
            }
        )
        
        print(f"✅ Knowledge base uploaded to S3: s3://{bucket_name}/{key}")
        
        # Also upload to Azure Cognitive Search format
        azure_format = {
            "documents": []
        }
        
        # Convert to Azure Cognitive Search document format
        for service_type, service_data in kb_data['wind_turbine_services_comprehensive'].items():
            if isinstance(service_data, dict) and 'description' in service_data:
                doc = {
                    "id": f"wind-turbine-{service_type}",
                    "title": service_type.replace('_', ' ').title(),
                    "content": json.dumps(service_data),
                    "category": "wind_turbine_services",
                    "service_type": service_type,
                    "description": service_data.get('description', ''),
                    "tags": [service_type, "wind_turbine", "renewable_energy", "swire"]
                }
                azure_format["documents"].append(doc)
        
        # Upload Azure format
        azure_key = f"azure-search/wind-turbine-services-{datetime.now().strftime('%Y%m%d')}.json"
        s3_client.put_object(
            Bucket=bucket_name,
            Key=azure_key,
            Body=json.dumps(azure_format, indent=2),
            ContentType='application/json',
            Metadata={
                'source': 'swire-intelligence-assistant',
                'format': 'azure-cognitive-search',
                'category': 'wind-turbine-services'
            }
        )
        
        print(f"✅ Azure format uploaded to S3: s3://{bucket_name}/{azure_key}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error uploading to S3: {e}")
        print("💡 Make sure AWS credentials are configured and S3 bucket exists")
        return False

if __name__ == "__main__":
    upload_knowledge_base_to_s3()