#!/bin/bash

source .env

echo "🚀 Deploying Bedrock Agent using Docker Hub image"

# Create ECS cluster
aws ecs create-cluster --cluster-name swire-bedrock --region us-east-1

# Create log group
aws logs create-log-group --log-group-name /ecs/swire-bedrock --region us-east-1 2>/dev/null || true

# Register task definition using Docker Hub image
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
    "image": "maplesage/swire-agent:latest",
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

echo "✅ Bedrock Agent task definition created!"
echo "🌐 Task Definition: swire-bedrock-task"
echo "📋 Image: maplesage/swire-agent:latest"
echo "🔗 Create ECS service in AWS Console with public IP"