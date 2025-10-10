#!/bin/bash

# Deploy directly to ECS without CloudFormation
echo "🚀 Direct ECS deployment"

# Create cluster
aws ecs create-cluster --cluster-name swire-cluster --region us-east-1

# Register task definition
aws ecs register-task-definition \
  --family swire-agent \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --execution-role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ecsTaskExecutionRole \
  --container-definitions '[{
    "name": "swire-agent",
    "image": "maplesage/swire-agent:latest",
    "portMappings": [{"containerPort": 8000}],
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/swire-agent",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]'

echo "✅ Task definition registered"
echo "🌐 Create service manually in AWS Console"