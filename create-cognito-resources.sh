#!/bin/bash

# Create Cognito User Pool and Identity Pool for SageGreen

echo "Creating Cognito User Pool..."

# Create User Pool
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "SageGreen-UserPool" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "name",
      "AttributeDataType": "String",
      "Required": false,
      "Mutable": true
    }
  ]' \
  --query 'UserPool.Id' --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create User Pool Client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name "SageGreen-WebClient" \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --supported-identity-providers COGNITO \
  --callback-urls "https://sagegreen.vercel.app/auth/callback,http://localhost:3000/auth/callback" \
  --logout-urls "https://sagegreen.vercel.app,http://localhost:3000" \
  --query 'UserPoolClient.ClientId' --output text)

echo "Client ID: $CLIENT_ID"

# Create User Pool Domain
DOMAIN_NAME="sagegreen-$(date +%s)"
aws cognito-idp create-user-pool-domain \
  --domain $DOMAIN_NAME \
  --user-pool-id $USER_POOL_ID

echo "Domain: https://$DOMAIN_NAME.auth.us-east-1.amazoncognito.com"

# Create Identity Pool
IDENTITY_POOL_ID=$(aws cognito-identity create-identity-pool \
  --identity-pool-name "SageGreen_IdentityPool" \
  --allow-unauthenticated-identities \
  --cognito-identity-providers ProviderName=cognito-idp.us-east-1.amazonaws.com/$USER_POOL_ID,ClientId=$CLIENT_ID \
  --query 'IdentityPoolId' --output text)

echo "Identity Pool ID: $IDENTITY_POOL_ID"

# Create IAM roles for authenticated and unauthenticated users
AUTHENTICATED_ROLE_ARN=$(aws iam create-role \
  --role-name SageGreen-Cognito-AuthRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "cognito-identity.amazonaws.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "cognito-identity.amazonaws.com:aud": "'$IDENTITY_POOL_ID'"
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated"
          }
        }
      }
    ]
  }' \
  --query 'Role.Arn' --output text)

UNAUTH_ROLE_ARN=$(aws iam create-role \
  --role-name SageGreen-Cognito-UnauthRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Federated": "cognito-identity.amazonaws.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "cognito-identity.amazonaws.com:aud": "'$IDENTITY_POOL_ID'"
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "unauthenticated"
          }
        }
      }
    ]
  }' \
  --query 'Role.Arn' --output text)

# Attach policies to roles
aws iam attach-role-policy \
  --role-name SageGreen-Cognito-AuthRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonCognitoPowerUser

aws iam attach-role-policy \
  --role-name SageGreen-Cognito-UnauthRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonCognitoUnAuthRole

# Set identity pool roles
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id $IDENTITY_POOL_ID \
  --roles authenticated=$AUTHENTICATED_ROLE_ARN,unauthenticated=$UNAUTH_ROLE_ARN

echo ""
echo "✅ Cognito Resources Created Successfully!"
echo ""
echo "Update your .env.local with these values:"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID"
echo "NEXT_PUBLIC_COGNITO_DOMAIN=https://$DOMAIN_NAME.auth.us-east-1.amazoncognito.com"
echo "NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=$IDENTITY_POOL_ID"
echo ""
echo "Create a test user:"
echo "aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username testuser@sagegreen.com --user-attributes Name=email,Value=testuser@sagegreen.com --temporary-password TempPass123! --message-action SUPPRESS"