import boto3
import json

def test_bedrock_agent():
    """Test direct connection to Bedrock agent"""
    
    client = boto3.client('bedrock-agent-runtime', region_name='us-east-1')
    
    try:
        response = client.invoke_agent(
            agentId='XMJHPK00RO',
            agentAliasId='PDGGKSDLVP',
            sessionId='test-session-123',
            inputText='Tell me about Swire Renewable Energy'
        )
        
        print("✅ Connection successful!")
        print("Response structure:", response.keys())
        
        # Process streaming response
        full_response = ''
        if 'completion' in response:
            for chunk in response['completion']:
                if 'chunk' in chunk and 'bytes' in chunk['chunk']:
                    chunk_text = chunk['chunk']['bytes'].decode('utf-8')
                    full_response += chunk_text
                    print(f"Chunk: {chunk_text}")
        
        print(f"\nFull response: {full_response}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"Error type: {type(e)}")
        return False

if __name__ == "__main__":
    test_bedrock_agent()