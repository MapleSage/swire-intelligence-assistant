#!/bin/bash

source .env

export AZURE_CLIENT_ID=$AWS_ACCESS_KEY_ID
export AZURE_CLIENT_SECRET=$AWS_SECRET_ACCESS_KEY

echo "🚀 Deploying FastAPI to Azure Container Instances"

# Login to Azure
az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant your-tenant-id

# Create resource group
az group create --name swire-rg --location eastus

# Create container registry
az acr create --resource-group swire-rg --name swireregistry --sku Basic --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name swireregistry --resource-group swire-rg --query "loginServer" --output tsv)

# Build and push to ACR
az acr build --registry swireregistry --image swire-agent:latest .

# Deploy to Container Instances
az container create \
  --resource-group swire-rg \
  --name swire-agent-api \
  --image $ACR_LOGIN_SERVER/swire-agent:latest \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username swireregistry \
  --registry-password $(az acr credential show --name swireregistry --query "passwords[0].value" --output tsv) \
  --dns-name-label swire-intelligence \
  --ports 8000 \
  --environment-variables AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY AWS_REGION=$AWS_REGION

# Get public IP
FQDN=$(az container show --resource-group swire-rg --name swire-agent-api --query "ipAddress.fqdn" --output tsv)

echo "✅ Deployed to Azure!"
echo "🌐 API URL: http://$FQDN:8000"
echo "🔗 Update frontend NEXT_PUBLIC_API_URL to: http://$FQDN:8000"