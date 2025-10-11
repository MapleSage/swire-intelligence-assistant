#!/bin/bash

source .env

echo "🤖 Testing Swire Intelligence Agent (XMJHPK00RO)"

# Get agent details
aws bedrock-agent get-agent --agent-id XMJHPK00RO --region us-east-1

echo ""
echo "🔗 Access your agent in Bedrock console:"
echo "https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/agents/XMJHPK00RO"

echo ""
echo "📝 Test the agent with a simple query:"
aws bedrock-agent-runtime invoke-agent \
    --agent-id XMJHPK00RO \
    --agent-alias-id TSTALIASID \
    --session-id test-session-$(date +%s) \
    --input-text "Hello, what can you help me with?" \
    --region us-east-1 \
    response.json

if [ -f response.json ]; then
    echo "✅ Agent response received!"
    cat response.json
    rm response.json
fi