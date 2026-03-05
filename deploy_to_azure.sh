#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  while IFS='=' read -r key value; do
    key="$(echo "$key" | xargs)"
    value="$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "${key// }" || "${key:0:1}" == "#" ]] && continue
    value="${value%$'\r'}"
    export "$key=$value"
  done < .env
  echo "Loaded configuration from .env"
else
  echo "Error: .env not found. Copy .env.example to .env and fill values."
  exit 1
fi

: "${AZURE_OPENAI_KEY:?AZURE_OPENAI_KEY is required}"
: "${AZURE_OPENAI_ENDPOINT:?AZURE_OPENAI_ENDPOINT is required}"
: "${AZURE_SEARCH_ENDPOINT:?AZURE_SEARCH_ENDPOINT is required}"
: "${AZURE_STORAGE_CONNECTION_STRING:?AZURE_STORAGE_CONNECTION_STRING is required}"

RG_NAME="${RG_NAME:-swire-rg}"
LOCATION="${LOCATION:-eastus}"
ACR_NAME="${ACR_NAME:-swirerenewableregistry}"
APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-swire-plan}"
WEB_APP_NAME="${WEB_APP_NAME:-swire-intelligence}"
AZURE_SEARCH_INDEX="${AZURE_SEARCH_INDEX:-swire-operations-index}"
AZURE_SEARCH_KEY="${AZURE_SEARCH_KEY:-}"
AZURE_OPENAI_DEPLOYMENT="${AZURE_OPENAI_DEPLOYMENT:-gpt-4o}"
AZURE_OPENAI_EMBEDDING_DEPLOYMENT="${AZURE_OPENAI_EMBEDDING_DEPLOYMENT:-text-embedding-3-small}"

echo "Deploying Swire Intelligence Assistant to Azure"
echo "Resource Group: $RG_NAME | Region: $LOCATION | App: $WEB_APP_NAME"

az group create --name "$RG_NAME" --location "$LOCATION" >/dev/null

if ! az acr show --name "$ACR_NAME" --resource-group "$RG_NAME" >/dev/null 2>&1; then
  az acr create --resource-group "$RG_NAME" --name "$ACR_NAME" --sku Basic --admin-enabled true >/dev/null
fi

ACR_LOGIN_SERVER="$(az acr show --name "$ACR_NAME" --resource-group "$RG_NAME" --query loginServer --output tsv)"
ACR_USERNAME="$(az acr credential show --name "$ACR_NAME" --query username --output tsv)"
ACR_PASSWORD="$(az acr credential show --name "$ACR_NAME" --query passwords[0].value --output tsv)"

echo "Using ACR remote builds (CLI-only mode)."
az acr build --registry "$ACR_NAME" --image swire-frontend:latest ./swire-frontend >/dev/null

if ! az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RG_NAME" >/dev/null 2>&1; then
  az appservice plan create --name "$APP_SERVICE_PLAN" --resource-group "$RG_NAME" --is-linux --sku B1 >/dev/null
fi

FRONTEND_IMAGE="$ACR_LOGIN_SERVER/swire-frontend:latest"

if ! az webapp show --name "$WEB_APP_NAME" --resource-group "$RG_NAME" >/dev/null 2>&1; then
  az webapp create \
    --resource-group "$RG_NAME" \
    --plan "$APP_SERVICE_PLAN" \
    --name "$WEB_APP_NAME" \
    --deployment-container-image-name "$FRONTEND_IMAGE" >/dev/null
else
  az webapp config container set \
    --resource-group "$RG_NAME" \
    --name "$WEB_APP_NAME" \
    --container-image-name "$FRONTEND_IMAGE" \
    --container-registry-url "https://$ACR_LOGIN_SERVER" \
    --container-registry-user "$ACR_USERNAME" \
    --container-registry-password "$ACR_PASSWORD" >/dev/null
fi

az webapp identity assign --resource-group "$RG_NAME" --name "$WEB_APP_NAME" >/dev/null
WEB_APP_PRINCIPAL_ID="$(az webapp show --name "$WEB_APP_NAME" --resource-group "$RG_NAME" --query identity.principalId --output tsv)"
ACR_ID="$(az acr show --name "$ACR_NAME" --resource-group "$RG_NAME" --query id --output tsv)"

if ! az role assignment list --assignee "$WEB_APP_PRINCIPAL_ID" --scope "$ACR_ID" --query "[?roleDefinitionName=='AcrPull'] | length(@)" --output tsv | grep -q '^1$'; then
  az role assignment create --assignee "$WEB_APP_PRINCIPAL_ID" --scope "$ACR_ID" --role AcrPull >/dev/null
fi

az webapp config appsettings set --resource-group "$RG_NAME" --name "$WEB_APP_NAME" --settings \
  DOCKER_REGISTRY_SERVER_URL="https://$ACR_LOGIN_SERVER" \
  DOCKER_REGISTRY_SERVER_USERNAME="$ACR_USERNAME" \
  DOCKER_REGISTRY_SERVER_PASSWORD="$ACR_PASSWORD" \
  WEBSITES_PORT=3000 \
  WEBSITES_CONTAINER_START_TIME_LIMIT=1800 \
  AZURE_OPENAI_KEY="$AZURE_OPENAI_KEY" \
  AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
  AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT="$AZURE_OPENAI_EMBEDDING_DEPLOYMENT" \
  AZURE_SEARCH_KEY="$AZURE_SEARCH_KEY" \
  AZURE_SEARCH_ENDPOINT="$AZURE_SEARCH_ENDPOINT" \
  AZURE_SEARCH_INDEX="$AZURE_SEARCH_INDEX" \
  AZURE_STORAGE_CONNECTION_STRING="$AZURE_STORAGE_CONNECTION_STRING" >/dev/null

az webapp restart --name "$WEB_APP_NAME" --resource-group "$RG_NAME" >/dev/null

echo "Deployment complete"
echo "URL: https://$WEB_APP_NAME.azurewebsites.net"
