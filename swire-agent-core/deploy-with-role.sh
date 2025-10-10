#!/bin/bash

source .env

echo "🚀 Deploying Bedrock Agent with IAM role"

# Assume the role
ROLE_CREDS=$(aws sts assume-role \
  --role-arn arn:aws:iam::679217508095:role/sweri-bedrock \
  --role-session-name swire-deployment \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)

export AWS_ACCESS_KEY_ID=$(echo $ROLE_CREDS | cut -d' ' -f1)
export AWS_SECRET_ACCESS_KEY=$(echo $ROLE_CREDS | cut -d' ' -f2)
export AWS_SESSION_TOKEN=$(echo $ROLE_CREDS | cut -d' ' -f3)

# Create ECR repo
aws ecr create-repository --repository-name swire-bedrock-agent --region us-east-1 2>/dev/null || true

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 679217508095.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t swire-bedrock-agent .
docker tag swire-bedrock-agent:latest 679217508095.dkr.ecr.us-east-1.amazonaws.com/swire-bedrock-agent:latest
docker push 679217508095.dkr.ecr.us-east-1.amazonaws.com/swire-bedrock-agent:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name swire-bedrock --region us-east-1

# Register task definition
aws ecs register-task-definition \
  --family swire-bedrock-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::679217508095:role/sweri-bedrock \
  --task-role-arn arn:aws:iam::679217508095:role/sweri-bedrock \
  --container-definitions '[{
    "name": "swire-bedrock-agent",
    "image": "679217508095.dkr.ecr.us-east-1.amazonaws.com/swire-bedrock-agent:latest",
    "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/swire-bedrock",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]' \
  --region us-east-1

echo "✅ Bedrock Agent deployed to ECS!"
echo "🌐 Create service in AWS Console with public IP"