#!/bin/bash

source .env

echo "🔐 Adding ECS and ECR permissions to user"

# Create policy for ECS, ECR, CloudFormation
cat > swire-deployment-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecs:*",
                "ecr:*",
                "cloudformation:*",
                "iam:PassRole",
                "logs:*",
                "ec2:*",
                "elasticloadbalancing:*"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Create policy
aws iam create-policy \
    --policy-name SwireDeploymentPolicy \
    --policy-document file://swire-deployment-policy.json

# Attach to user
aws iam attach-user-policy \
    --user-name BedrockAPIKey-h9a8 \
    --policy-arn arn:aws:iam::679217508095:policy/SwireDeploymentPolicy

echo "✅ Permissions added!"
echo "🚀 Now run: ./deploy-bedrock-agent.sh"