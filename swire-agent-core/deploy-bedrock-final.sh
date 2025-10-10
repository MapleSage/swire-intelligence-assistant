#!/bin/bash

source .env

echo "🚀 Deploying Bedrock Agent with proper roles"

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

# Create log group
aws logs create-log-group --log-group-name /ecs/swire-bedrock --region us-east-1 2>/dev/null || true

# Register task definition with proper roles
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
    "environment": [
      {"name": "AWS_REGION", "value": "us-east-1"},
      {"name": "BEDROCK_MODEL_ID", "value": "anthropic.claude-3-sonnet-20240229-v1:0"}
    ],
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
echo "🌐 Task Definition: swire-bedrock-task"
echo "📋 Next: Create ECS service in AWS Console with public IP"
echo "🔗 Use public IP:8000 as API endpoint"