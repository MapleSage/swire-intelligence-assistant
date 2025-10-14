import boto3
import json
from datetime import datetime

def upload_docker_kb_to_s3():
    """Upload Docker manifest KB to S3 and prepare for Azure Cognitive Search"""
    
    try:
        s3_client = boto3.client('s3')
        bucket_name = 'bedrock-agent-kb-swire'
        
        # Load the Docker KB
        with open('/Volumes/Macintosh HD Ext./Developer/swire/docker_swire-agent_latest_kb.json', 'r') as f:
            kb_data = json.load(f)
        
        # Upload original KB to S3
        kb_key = f"knowledge-base/docker-manifest-{datetime.now().strftime('%Y%m%d')}.json"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=kb_key,
            Body=json.dumps(kb_data, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Docker KB uploaded: s3://{bucket_name}/{kb_key}")
        
        # Convert to Azure Cognitive Search format
        azure_docs = {
            "documents": [
                {
                    "id": "docker-swire-agent-manifest",
                    "title": "Swire Agent Docker Container Manifest",
                    "content": f"Docker container for Swire Agent with digest {kb_data['docker_manifest']['digest']}. Platform: {kb_data['docker_manifest']['platform']}. Total size: {kb_data['deployment_info']['total_size_mb']} MB with {kb_data['deployment_info']['layer_count']} layers.",
                    "category": "infrastructure",
                    "tags": ["docker", "swire-agent", "container", "deployment"],
                    "metadata": kb_data['docker_manifest']
                },
                {
                    "id": "docker-layers-info",
                    "title": "Docker Image Layers Information",
                    "content": f"Multi-layer Docker image with {len(kb_data['layers'])} layers. Main application layer size: {kb_data['layers'][7]['size']} bytes. Includes base OS, Python runtime, dependencies, and Swire Agent Core application.",
                    "category": "infrastructure",
                    "tags": ["docker-layers", "image-structure", "deployment"],
                    "metadata": {"layers": kb_data['layers']}
                }
            ]
        }
        
        # Upload Azure format
        azure_key = f"azure-search/docker-manifest-{datetime.now().strftime('%Y%m%d')}.json"
        s3_client.put_object(
            Bucket=bucket_name,
            Key=azure_key,
            Body=json.dumps(azure_docs, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Azure format uploaded: s3://{bucket_name}/{azure_key}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    upload_docker_kb_to_s3()