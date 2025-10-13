#!/bin/bash

# Create Knowledge Base for Bedrock Agent
echo "Creating knowledge base..."

# Create the knowledge base
aws bedrock-agent create-knowledge-base \
    --name "swire-renewable-energy-kb" \
    --description "Swire Renewable Energy company knowledge base" \
    --role-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonBedrockExecutionRoleForKnowledgeBase_swire" \
    --knowledge-base-configuration '{
        "type": "VECTOR",
        "vectorKnowledgeBaseConfiguration": {
            "embeddingModelArn": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
        }
    }' \
    --storage-configuration '{
        "type": "OPENSEARCH_SERVERLESS",
        "opensearchServerlessConfiguration": {
            "collectionArn": "arn:aws:aoss:us-east-1:$(aws sts get-caller-identity --query Account --output text):collection/swire-kb-collection",
            "vectorIndexName": "swire-index",
            "fieldMapping": {
                "vectorField": "vector",
                "textField": "text",
                "metadataField": "metadata"
            }
        }
    }' \
    --region us-east-1 \
    --output json > kb-response.json

KB_ID=$(cat kb-response.json | jq -r '.knowledgeBase.knowledgeBaseId')
echo "Knowledge Base ID: $KB_ID"

# Create data source
echo "Creating data source..."
aws bedrock-agent create-data-source \
    --knowledge-base-id "$KB_ID" \
    --name "swire-s3-data" \
    --description "Swire company data from S3" \
    --data-source-configuration '{
        "type": "S3",
        "s3Configuration": {
            "bucketArn": "arn:aws:s3:::swire-knowledge-base-bucket"
        }
    }' \
    --region us-east-1 \
    --output json > ds-response.json

DS_ID=$(cat ds-response.json | jq -r '.dataSource.dataSourceId')
echo "Data Source ID: $DS_ID"

# Associate with Bedrock Agent
echo "Associating knowledge base with agent..."
aws bedrock-agent associate-agent-knowledge-base \
    --agent-id "XMJHPK00RO" \
    --agent-version "DRAFT" \
    --knowledge-base-id "$KB_ID" \
    --description "Swire Renewable Energy knowledge base" \
    --knowledge-base-state "ENABLED" \
    --region us-east-1

echo "Knowledge base setup complete!"
echo "KB ID: $KB_ID"
echo "DS ID: $DS_ID"