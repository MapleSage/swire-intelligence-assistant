#!/bin/bash

# Deploy real Bedrock agent to AWS
echo "🤖 Deploying Bedrock Agent Core to AWS"

# Check for valid AWS credentials
if ! aws sts get-caller-identity; then
    echo "❌ Need valid AWS credentials with Bedrock access"
    echo "Set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION"
    exit 1
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

# Create ECR repo
aws ecr create-repository --repository-name swire-bedrock-agent --region $REGION 2>/dev/null || true

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build with Bedrock agent
docker build -t swire-bedrock-agent .
docker tag swire-bedrock-agent:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/swire-bedrock-agent:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/swire-bedrock-agent:latest

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file aws-infrastructure.yaml \
  --stack-name swire-bedrock-agent \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ImageUri=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/swire-bedrock-agent:latest

# Get ALB URL
ALB_URL=$(aws cloudformation describe-stacks --stack-name swire-bedrock-agent --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' --output text)

echo "✅ Bedrock Agent deployed!"
echo "🌐 API URL: $ALB_URL"
echo "🔗 Update frontend NEXT_PUBLIC_API_URL to: $ALB_URL"