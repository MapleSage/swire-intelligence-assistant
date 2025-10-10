#!/bin/bash

source .env

echo "🚀 Assuming sweri-bedrock role and deploying"

# Assume the sweri-bedrock role
ROLE_CREDS=$(aws sts assume-role \
  --role-arn arn:aws:iam::679217508095:role/sweri-bedrock \
  --role-session-name swire-deployment \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)

# Export temporary credentials
export AWS_ACCESS_KEY_ID=$(echo $ROLE_CREDS | cut -d' ' -f1)
export AWS_SECRET_ACCESS_KEY=$(echo $ROLE_CREDS | cut -d' ' -f2)
export AWS_SESSION_TOKEN=$(echo $ROLE_CREDS | cut -d' ' -f3)

echo "✅ Assumed role successfully"

# Create ECS cluster
aws ecs create-cluster --cluster-name swire-bedrock --region us-east-1

# Create log group
aws logs create-log-group --log-group-name /ecs/swire-bedrock --region us-east-1 2>/dev/null || true

# Register task definition using sweri-bedrock role
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

echo "✅ Bedrock Agent deployed using sweri-bedrock role!"
echo "🌐 Task Definition: swire-bedrock-task"
echo "🔗 Create ECS service in AWS Console"