#!/bin/bash

# Load AWS credentials from .env
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with AWS credentials."
    exit 1
fi

source .env

# Export AWS credentials
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_REGION

echo "🚀 Deploying Swire Intelligence Assistant to AWS"
echo "📍 Region: $AWS_DEFAULT_REGION"

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    echo "   OR set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    echo "   OR use IAM role if running on EC2"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $AWS_ACCOUNT_ID"

# ECR Repository name
ECR_REPO="swire-agent"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPO"

# 1. Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO >/dev/null 2>&1 || \
aws ecr create-repository --repository-name $ECR_REPO

# 2. Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_URI

# 3. Build and push Docker image
echo "🏗️ Building Docker image..."
docker build -t $ECR_REPO .
docker tag $ECR_REPO:latest $ECR_URI:latest

echo "📤 Pushing to ECR..."
docker push $ECR_URI:latest

# Create IAM role if it doesn't exist
echo "🔐 Creating IAM role..."
if ! aws iam get-role --role-name SwireAgentRole >/dev/null 2>&1; then
    chmod +x create-iam-role.sh
    ./create-iam-role.sh
else
    echo "ℹ️ IAM role already exists"
fi

echo "✅ Deployment complete!"
echo "🌐 Image: $ECR_URI:latest"
echo "🔐 Role: arn:aws:iam::$AWS_ACCOUNT_ID:role/SwireAgentRole"
echo ""
echo "Next: Deploy to ECS with the role and image above"