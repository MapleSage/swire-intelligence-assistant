#!/bin/bash

source .env

echo "🔍 Testing Bedrock access with current credentials"

# Test Bedrock model access
echo "Testing Claude model access..."
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude`)].{ModelId:modelId,ModelName:modelName}' --output table

echo ""
echo "Testing Bedrock agent access..."
aws bedrock-agent list-agents --region us-east-1 --output table

echo ""
echo "If you see models listed above, Bedrock access is working!"
echo "If not, you need to:"
echo "1. Enable model access in Bedrock console"
echo "2. Request access to Claude models"
echo "3. Check your AWS account has Bedrock enabled"