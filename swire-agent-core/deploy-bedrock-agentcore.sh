#!/bin/bash

source .env

echo "🤖 Deploying with Bedrock Agent Core"

# Create Bedrock Agent Core trust policy
cat > bedrock-agentcore-trust.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowAccessToBedrockAgentcore",
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock-agentcore.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        },
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Update the sweri-bedrock role trust policy
aws iam update-assume-role-policy \
  --role-name sweri-bedrock \
  --policy-document file://bedrock-agentcore-trust.json

# Create Bedrock Agent
aws bedrock-agent create-agent \
  --agent-name "SwireIntelligenceAgent" \
  --agent-resource-role-arn "arn:aws:iam::679217508095:role/sweri-bedrock" \
  --foundation-model "anthropic.claude-3-sonnet-20240229-v1:0" \
  --instruction "You are Swire Intelligence Assistant. Help with finance, operations, safety, and HR queries for Swire renewable energy operations." \
  --region us-east-1

echo "✅ Bedrock Agent Core created!"
echo "🤖 Agent: SwireIntelligenceAgent"
echo "🔗 Role: arn:aws:iam::679217508095:role/sweri-bedrock"

# Cleanup
rm bedrock-agentcore-trust.json