import boto3
import json
from config import config

class BedrockClient:
    def __init__(self):
        self.client = boto3.client('bedrock-runtime', region_name=config.aws_region)
        self.model_id = config.bedrock_model_id
    
    def call_bedrock(self, prompt: str) -> str:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "messages": [{"role": "user", "content": prompt}]
        })
        
        response = self.client.invoke_model(
            modelId=self.model_id,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']