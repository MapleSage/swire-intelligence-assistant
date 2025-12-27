#!/bin/bash

# Deployment script for Swire Intelligence Assistant Azure infrastructure
# Ensures EU compliance by deploying all resources in West Europe region

set -e

# Configuration
ENVIRONMENT=${1:-dev}
LOCATION="westeurope"
RESOURCE_PREFIX="swire-copilot"
SUBSCRIPTION_ID=""
RESOURCE_GROUP_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-rg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Get current subscription
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    print_status "Using subscription: $SUBSCRIPTION_ID"
    
    # Verify location supports required services
    print_status "Verifying Azure OpenAI availability in $LOCATION..."
    if ! az provider show --namespace Microsoft.CognitiveServices --query "resourceTypes[?resourceType=='accounts'].locations" -o tsv | grep -q "$LOCATION"; then
        print_warning "Azure OpenAI might not be available in $LOCATION. Continuing anyway..."
    fi
    
    print_success "Prerequisites check completed"
}

# Function to create resource group
create_resource_group() {
    print_status "Creating resource group: $RESOURCE_GROUP_NAME"
    
    if az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
        print_warning "Resource group $RESOURCE_GROUP_NAME already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP_NAME" \
            --location "$LOCATION" \
            --tags Environment="$ENVIRONMENT" Project="Swire-Intelligence-Assistant" Compliance="EU-Data-Residency"
        
        print_success "Resource group created successfully"
    fi
}

# Function to deploy Azure resources using Bicep
deploy_resources() {
    print_status "Deploying Azure resources using Bicep template..."
    
    DEPLOYMENT_NAME="swire-copilot-deployment-$(date +%Y%m%d-%H%M%S)"
    
    az deployment group create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --template-file "azure-resources.bicep" \
        --parameters environment="$ENVIRONMENT" \
                    location="$LOCATION" \
                    resourcePrefix="$RESOURCE_PREFIX" \
        --name "$DEPLOYMENT_NAME" \
        --verbose
    
    print_success "Azure resources deployed successfully"
}

# Function to configure RBAC permissions
configure_rbac() {
    print_status "Configuring RBAC permissions..."
    
    # Get current user object ID
    CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)
    
    # Get resource IDs
    KEY_VAULT_ID=$(az keyvault show --name "${RESOURCE_PREFIX}-${ENVIRONMENT}-kv" --resource-group "$RESOURCE_GROUP_NAME" --query id -o tsv)
    OPENAI_ID=$(az cognitiveservices account show --name "${RESOURCE_PREFIX}-${ENVIRONMENT}-openai" --resource-group "$RESOURCE_GROUP_NAME" --query id -o tsv)
    SEARCH_ID=$(az search service show --name "${RESOURCE_PREFIX}-${ENVIRONMENT}-search" --resource-group "$RESOURCE_GROUP_NAME" --query id -o tsv)
    STORAGE_ID=$(az storage account show --name "${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage" --resource-group "$RESOURCE_GROUP_NAME" --query id -o tsv)
    
    # Assign Key Vault Administrator role
    az role assignment create \
        --assignee "$CURRENT_USER_ID" \
        --role "Key Vault Administrator" \
        --scope "$KEY_VAULT_ID"
    
    # Assign Cognitive Services OpenAI User role
    az role assignment create \
        --assignee "$CURRENT_USER_ID" \
        --role "Cognitive Services OpenAI User" \
        --scope "$OPENAI_ID"
    
    # Assign Search Service Contributor role
    az role assignment create \
        --assignee "$CURRENT_USER_ID" \
        --role "Search Service Contributor" \
        --scope "$SEARCH_ID"
    
    # Assign Storage Blob Data Contributor role
    az role assignment create \
        --assignee "$CURRENT_USER_ID" \
        --role "Storage Blob Data Contributor" \
        --scope "$STORAGE_ID"
    
    print_success "RBAC permissions configured"
}

# Function to store secrets in Key Vault
store_secrets() {
    print_status "Storing configuration secrets in Key Vault..."
    
    KEY_VAULT_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-kv"
    
    # Get service endpoints
    OPENAI_ENDPOINT=$(az cognitiveservices account show --name "${RESOURCE_PREFIX}-${ENVIRONMENT}-openai" --resource-group "$RESOURCE_GROUP_NAME" --query properties.endpoint -o tsv)
    SEARCH_ENDPOINT="https://${RESOURCE_PREFIX}-${ENVIRONMENT}-search.search.windows.net"
    STORAGE_CONNECTION=$(az storage account show-connection-string --name "${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage" --resource-group "$RESOURCE_GROUP_NAME" --query connectionString -o tsv)
    
    # Store secrets
    az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "OpenAI-Endpoint" --value "$OPENAI_ENDPOINT"
    az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "Search-Endpoint" --value "$SEARCH_ENDPOINT"
    az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "Storage-ConnectionString" --value "$STORAGE_CONNECTION"
    az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "Environment" --value "$ENVIRONMENT"
    az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "Location" --value "$LOCATION"
    
    print_success "Secrets stored in Key Vault"
}

# Function to validate deployment
validate_deployment() {
    print_status "Validating deployment..."
    
    # Check if all resources are created
    RESOURCES=(
        "${RESOURCE_PREFIX}-${ENVIRONMENT}-kv:Microsoft.KeyVault/vaults"
        "${RESOURCE_PREFIX}-${ENVIRONMENT}-openai:Microsoft.CognitiveServices/accounts"
        "${RESOURCE_PREFIX}-${ENVIRONMENT}-search:Microsoft.Search/searchServices"
        "${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage:Microsoft.Storage/storageAccounts"
        "${RESOURCE_PREFIX}-${ENVIRONMENT}-insights:Microsoft.Insights/components"
    )
    
    for resource in "${RESOURCES[@]}"; do
        IFS=':' read -r name type <<< "$resource"
        if az resource show --name "$name" --resource-group "$RESOURCE_GROUP_NAME" --resource-type "$type" &> /dev/null; then
            print_success "✓ $name ($type)"
        else
            print_error "✗ $name ($type) - Not found"
        fi
    done
    
    print_success "Deployment validation completed"
}

# Function to display deployment summary
display_summary() {
    print_status "Deployment Summary"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Location: $LOCATION"
    echo "Resource Group: $RESOURCE_GROUP_NAME"
    echo "Subscription: $SUBSCRIPTION_ID"
    echo ""
    echo "Key Resources:"
    echo "- Azure OpenAI Service: ${RESOURCE_PREFIX}-${ENVIRONMENT}-openai"
    echo "- Cognitive Search: ${RESOURCE_PREFIX}-${ENVIRONMENT}-search"
    echo "- Key Vault: ${RESOURCE_PREFIX}-${ENVIRONMENT}-kv"
    echo "- Storage Account: ${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage"
    echo "- Application Insights: ${RESOURCE_PREFIX}-${ENVIRONMENT}-insights"
    echo ""
    echo "Next Steps:"
    echo "1. Configure Microsoft Copilot Studio environment"
    echo "2. Set up Power Platform connectors"
    echo "3. Deploy Teams integration"
    echo ""
    print_success "Deployment completed successfully!"
}

# Main execution
main() {
    echo "========================================"
    echo "Swire Intelligence Assistant Deployment"
    echo "========================================"
    echo "Environment: $ENVIRONMENT"
    echo "Location: $LOCATION (EU Compliance)"
    echo ""
    
    check_prerequisites
    create_resource_group
    deploy_resources
    configure_rbac
    store_secrets
    validate_deployment
    display_summary
}

# Run main function
main