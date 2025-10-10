#!/bin/bash

source .env

echo "🚀 Deploying Bedrock Agent using Docker Hub image"

# Create ECS cluster
aws ecs create-cluster --cluster-name swire-bedrock-cluster --region us-east-1

# Create task definition using Docker Hub image
aws ecs register-task-definition \
  --family swire-bedrock-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --container-definitions '[{
    "name": "swire-bedrock-agent",
    "image": "maplesage/swire-agent:latest",
    "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
    "essential": true,
    "environment": [
      {"name": "AWS_ACCESS_KEY_ID", "value": "'$AWS_ACCESS_KEY_ID'"},
      {"name": "AWS_SECRET_ACCESS_KEY", "value": "'$AWS_SECRET_ACCESS_KEY'"},
      {"name": "AWS_REGION", "value": "'$AWS_REGION'"},
      {"name": "BEDROCK_MODEL_ID", "value": "'$BEDROCK_MODEL_ID'"}
    ]
  }]' \
  --region us-east-1

echo "✅ Task definition created!"
echo "🌐 Create ECS service in AWS Console with public IP"
echo "📋 Task Definition: swire-bedrock-task"
echo "🔗 Use public IP:8000 as frontend API URL"