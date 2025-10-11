#!/bin/bash

echo "🔧 Fixing Bedrock permissions for sweri-bedrock role"

# Create comprehensive Bedrock policy
cat > bedrock-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:*",
                "bedrock-agent:*",
                "bedrock-runtime:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
    --role-name sweri-bedrock \
    --policy-name BedrockFullAccess \
    --policy-document file://bedrock-policy.json

echo "✅ Bedrock permissions added to sweri-bedrock role"

# Clean up
rm bedrock-policy.json

echo "🚀 Try accessing Bedrock console again"