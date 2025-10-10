#!/bin/bash

# Load AWS credentials from .env
source .env

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION

echo "🔐 Creating IAM role for Swire Agent..."

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["ecs-tasks.amazonaws.com", "ec2.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name SwireAgentRole \
  --assume-role-policy-document file://trust-policy.json

# Create policy for Bedrock and other services
cat > swire-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetFoundationModel",
        "bedrock:ListFoundationModels",
        "bedrock:CreateModelCustomizationJob",
        "bedrock:GetModelCustomizationJob",
        "bedrock:ListModelCustomizationJobs",
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create and attach policy
aws iam create-policy \
  --policy-name SwireAgentPolicy \
  --policy-document file://swire-policy.json

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach policy to role
aws iam attach-role-policy \
  --role-name SwireAgentRole \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/SwireAgentPolicy

# Attach AWS managed policies
aws iam attach-role-policy \
  --role-name SwireAgentRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create Bedrock execution role
cat > bedrock-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name SwireBedrockExecutionRole \
  --assume-role-policy-document file://bedrock-trust-policy.json 2>/dev/null || echo "Bedrock role exists"

# Attach Bedrock service role policy
aws iam attach-role-policy \
  --role-name SwireBedrockExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

echo "✅ IAM roles created:"
echo "   Agent: arn:aws:iam::$ACCOUNT_ID:role/SwireAgentRole"
echo "   Bedrock: arn:aws:iam::$ACCOUNT_ID:role/SwireBedrockExecutionRole"

# Cleanup
rm trust-policy.json swire-policy.json bedrock-trust-policy.json