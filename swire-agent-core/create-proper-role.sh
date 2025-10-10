#!/bin/bash

source .env

echo "🔐 Creating proper ECS execution role"

# Create trust policy for ECS tasks
cat > ecs-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create ECS execution role
aws iam create-role \
  --role-name SwireECSExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Attach AWS managed policy for ECS task execution
aws iam attach-role-policy \
  --role-name SwireECSExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role with Bedrock permissions
cat > bedrock-task-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetFoundationModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create Bedrock task role
aws iam create-role \
  --role-name SwireBedrockTaskRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Create and attach Bedrock policy
aws iam create-policy \
  --policy-name SwireBedrockPolicy \
  --policy-document file://bedrock-task-policy.json

aws iam attach-role-policy \
  --role-name SwireBedrockTaskRole \
  --policy-arn arn:aws:iam::679217508095:policy/SwireBedrockPolicy

echo "✅ Roles created:"
echo "   Execution: arn:aws:iam::679217508095:role/SwireECSExecutionRole"
echo "   Task: arn:aws:iam::679217508095:role/SwireBedrockTaskRole"

# Cleanup
rm ecs-trust-policy.json bedrock-task-policy.json