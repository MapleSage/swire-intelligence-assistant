#!/bin/bash

source .env

echo "🌐 Creating API Gateway for Bedrock Agent"

AGENT_ID="XMJHPK00RO"

# Create API Gateway
API_ID=$(aws apigateway create-rest-api \
  --name "SwireBedrockAgentAPI" \
  --description "API for Swire Bedrock Agent" \
  --query 'id' --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' --output text)

# Create /chat resource
CHAT_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "chat" \
  --query 'id' --output text)

# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $CHAT_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create integration with Bedrock Agent
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $CHAT_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:bedrock-agent-runtime:action/InvokeAgent"

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

echo "✅ API Gateway created!"
echo "🌐 API URL: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/chat"
echo "🤖 Agent ID: $AGENT_ID"