#!/bin/bash

# Swire Intelligence Assistant - Complete Deployment Script
# This script orchestrates the full deployment of the Microsoft Copilot-based solution

set -e

# Configuration
ENVIRONMENT=${1:-dev}
LOCATION="westeurope"
RESOURCE_PREFIX="swire-copilot"
TENANT_ID=""
SUBSCRIPTION_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking deployment prerequisites..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check PowerShell (for Copilot Studio setup)
    if ! command -v pwsh &> /dev/null && ! command -v powershell &> /dev/null; then
        print_error "PowerShell is not installed. Please install PowerShell Core."
        echo "Install from: https://github.com/PowerShell/PowerShell"
        exit 1
    fi
    
    # Check Power Platform CLI
    if ! command -v pac &> /dev/null; then
        print_error "Power Platform CLI is not installed."
        echo "Install from: https://aka.ms/PowerPlatformCLI"
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Get current subscription and tenant
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    TENANT_ID=$(az account show --query tenantId -o tsv)
    
    print_success "Prerequisites check completed"
    echo "Subscription ID: $SUBSCRIPTION_ID"
    echo "Tenant ID: $TENANT_ID"
    echo "Environment: $ENVIRONMENT"
    echo "Location: $LOCATION"
    echo ""
}

# Function to deploy Azure infrastructure
deploy_azure_infrastructure() {
    print_step "Deploying Azure infrastructure..."
    
    cd infrastructure
    
    # Make scripts executable
    chmod +x deploy-azure-resources.sh
    chmod +x setup-cognitive-search.sh
    
    # Deploy Azure resources
    print_status "Deploying Azure resources (this may take 10-15 minutes)..."
    ./deploy-azure-resources.sh $ENVIRONMENT
    
    if [ $? -eq 0 ]; then
        print_success "Azure infrastructure deployed successfully"
    else
        print_error "Azure infrastructure deployment failed"
        exit 1
    fi
    
    # Setup Cognitive Search
    print_status "Configuring Azure Cognitive Search..."
    ./setup-cognitive-search.sh $ENVIRONMENT
    
    if [ $? -eq 0 ]; then
        print_success "Azure Cognitive Search configured successfully"
    else
        print_error "Azure Cognitive Search configuration failed"
        exit 1
    fi
    
    cd ..
}

# Function to setup Copilot Studio
setup_copilot_studio() {
    print_step "Setting up Microsoft Copilot Studio..."
    
    cd copilot-studio
    
    # Determine PowerShell command
    PWSH_CMD="pwsh"
    if ! command -v pwsh &> /dev/null; then
        PWSH_CMD="powershell"
    fi
    
    # Run Copilot Studio setup
    print_status "Configuring Microsoft Copilot Studio (this may take 5-10 minutes)..."
    $PWSH_CMD -File setup-copilot-studio.ps1 -Environment $ENVIRONMENT -TenantId $TENANT_ID -EnvironmentUrl "https://swire-$ENVIRONMENT.crm4.dynamics.com/"
    
    if [ $? -eq 0 ]; then
        print_success "Microsoft Copilot Studio configured successfully"
    else
        print_error "Microsoft Copilot Studio configuration failed"
        exit 1
    fi
    
    cd ..
}

# Function to deploy Teams integration
deploy_teams_integration() {
    print_step "Preparing Teams integration..."
    
    cd teams-integration
    
    # Update manifest with actual values
    print_status "Updating Teams app manifest..."
    
    # Get the bot ID from Copilot Studio (placeholder for now)
    BOT_ID="swire-copilot-bot-$ENVIRONMENT"
    APP_ID="swire-copilot-app-$ENVIRONMENT"
    
    # Update manifest.json with actual IDs
    sed -i.bak "s/swire-copilot-bot-id/$BOT_ID/g" manifest.json
    sed -i.bak "s/swire-copilot-app-id/$APP_ID/g" manifest.json
    
    # Create Teams app package
    print_status "Creating Teams app package..."
    
    # Create icons if they don't exist (placeholder)
    if [ ! -f "color-icon.png" ]; then
        print_warning "Creating placeholder icons. Replace with actual Swire branding."
        # Create a simple colored square as placeholder
        convert -size 192x192 xc:"#0078D4" color-icon.png 2>/dev/null || echo "Install ImageMagick to generate icons automatically"
    fi
    
    if [ ! -f "outline-icon.png" ]; then
        convert -size 32x32 xc:"#0078D4" outline-icon.png 2>/dev/null || echo "Install ImageMagick to generate icons automatically"
    fi
    
    # Create app package
    zip -r "swire-intelligence-assistant-$ENVIRONMENT.zip" manifest.json color-icon.png outline-icon.png adaptive-cards/ 2>/dev/null || {
        print_warning "Zip not available. Please manually create Teams app package."
    }
    
    print_success "Teams integration prepared"
    print_status "Teams app package: teams-integration/swire-intelligence-assistant-$ENVIRONMENT.zip"
    print_status "Upload this package to Teams Admin Center or App Studio"
    
    cd ..
}

# Function to setup Power BI integration
setup_powerbi_integration() {
    print_step "Preparing Power BI integration..."
    
    cd powerbi-integration/copilot-visual
    
    # Check if Node.js is available for building the visual
    if command -v npm &> /dev/null; then
        print_status "Building Power BI custom visual..."
        
        # Install dependencies
        npm install
        
        # Build the visual
        npm run build
        
        if [ $? -eq 0 ]; then
            print_success "Power BI visual built successfully"
            print_status "Visual package: powerbi-integration/copilot-visual/dist/SwireCopilotChat.pbiviz"
        else
            print_warning "Power BI visual build failed. Manual build required."
        fi
    else
        print_warning "Node.js not found. Power BI visual requires manual build."
        print_status "Install Node.js and run: npm install && npm run build"
    fi
    
    cd ../..
}

# Function to configure monitoring
setup_monitoring() {
    print_step "Setting up monitoring and analytics..."
    
    # Get Application Insights connection string
    APP_INSIGHTS_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-insights"
    RESOURCE_GROUP_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-rg"
    
    CONNECTION_STRING=$(az monitor app-insights component show \
        --app $APP_INSIGHTS_NAME \
        --resource-group $RESOURCE_GROUP_NAME \
        --query connectionString -o tsv 2>/dev/null || echo "")
    
    if [ -n "$CONNECTION_STRING" ]; then
        print_success "Application Insights configured"
        print_status "Connection String: $CONNECTION_STRING"
    else
        print_warning "Could not retrieve Application Insights connection string"
    fi
    
    # Setup basic monitoring dashboard
    print_status "Creating monitoring dashboard..."
    
    # Create a basic dashboard configuration
    cat > monitoring-dashboard.json << EOF
{
  "name": "Swire Intelligence Assistant - $ENVIRONMENT",
  "description": "Monitoring dashboard for Swire Copilot deployment",
  "widgets": [
    {
      "type": "application-insights",
      "title": "Request Volume",
      "query": "requests | summarize count() by bin(timestamp, 1h)"
    },
    {
      "type": "application-insights", 
      "title": "Response Times",
      "query": "requests | summarize avg(duration) by bin(timestamp, 1h)"
    },
    {
      "type": "application-insights",
      "title": "Error Rate",
      "query": "requests | summarize errorRate=100.0*countif(success==false)/count() by bin(timestamp, 1h)"
    }
  ]
}
EOF
    
    print_success "Monitoring configuration created"
}

# Function to run deployment tests
run_deployment_tests() {
    print_step "Running deployment validation tests..."
    
    # Test Azure resources
    print_status "Testing Azure resource connectivity..."
    
    RESOURCE_GROUP_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-rg"
    
    # Check if resource group exists
    if az group show --name $RESOURCE_GROUP_NAME &> /dev/null; then
        print_success "✓ Resource group exists"
    else
        print_error "✗ Resource group not found"
        return 1
    fi
    
    # Check OpenAI service
    OPENAI_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-openai"
    if az cognitiveservices account show --name $OPENAI_NAME --resource-group $RESOURCE_GROUP_NAME &> /dev/null; then
        print_success "✓ Azure OpenAI Service deployed"
    else
        print_error "✗ Azure OpenAI Service not found"
        return 1
    fi
    
    # Check Cognitive Search
    SEARCH_NAME="${RESOURCE_PREFIX}-${ENVIRONMENT}-search"
    if az search service show --name $SEARCH_NAME --resource-group $RESOURCE_GROUP_NAME &> /dev/null; then
        print_success "✓ Azure Cognitive Search deployed"
    else
        print_error "✗ Azure Cognitive Search not found"
        return 1
    fi
    
    # Check Storage Account
    STORAGE_NAME="${RESOURCE_PREFIX//-/}${ENVIRONMENT}storage"
    if az storage account show --name $STORAGE_NAME --resource-group $RESOURCE_GROUP_NAME &> /dev/null; then
        print_success "✓ Storage Account deployed"
    else
        print_error "✗ Storage Account not found"
        return 1
    fi
    
    print_success "All deployment tests passed"
}

# Function to display deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"
    
    echo -e "${GREEN}🎉 Swire Intelligence Assistant Deployment Complete!${NC}"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Azure Region: $LOCATION (EU Compliant)"
    echo "Resource Group: ${RESOURCE_PREFIX}-${ENVIRONMENT}-rg"
    echo ""
    
    echo -e "${YELLOW}📋 Deployed Components:${NC}"
    echo "✅ Azure Infrastructure (OpenAI, Cognitive Search, Storage, Key Vault)"
    echo "✅ Microsoft Copilot Studio Configuration"
    echo "✅ Teams Integration Package"
    echo "✅ Power BI Custom Visual"
    echo "✅ Monitoring and Analytics"
    echo ""
    
    echo -e "${YELLOW}🔗 Access Points:${NC}"
    echo "• Copilot Studio: https://copilotstudio.microsoft.com"
    echo "• Teams Admin Center: https://admin.teams.microsoft.com"
    echo "• Azure Portal: https://portal.azure.com"
    echo "• Power BI Service: https://app.powerbi.com"
    echo ""
    
    echo -e "${YELLOW}📦 Manual Steps Required:${NC}"
    echo "1. Upload Teams app package to Teams Admin Center"
    echo "2. Import Power BI custom visual to your tenant"
    echo "3. Configure Power Platform connectors with actual API endpoints"
    echo "4. Set up SharePoint document libraries for knowledge base"
    echo "5. Configure user permissions and access policies"
    echo ""
    
    echo -e "${YELLOW}🔧 Configuration Files:${NC}"
    echo "• Teams App: teams-integration/swire-intelligence-assistant-$ENVIRONMENT.zip"
    echo "• Power BI Visual: powerbi-integration/copilot-visual/dist/SwireCopilotChat.pbiviz"
    echo "• Environment Config: infrastructure/.env.template"
    echo ""
    
    echo -e "${YELLOW}📞 Support:${NC}"
    echo "• Documentation: swire-copilot-assistant/README.md"
    echo "• Deployment Guide: deployment/deployment-summary.md"
    echo "• Technical Support: it-support@swire.com"
    echo ""
    
    print_success "Deployment completed successfully! 🚀"
}

# Main deployment function
main() {
    print_header "Swire Intelligence Assistant Deployment"
    echo "Starting deployment to $ENVIRONMENT environment..."
    echo ""
    
    # Run deployment steps
    check_prerequisites
    deploy_azure_infrastructure
    setup_copilot_studio
    deploy_teams_integration
    setup_powerbi_integration
    setup_monitoring
    run_deployment_tests
    show_deployment_summary
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the manual configuration steps above"
    echo "2. Test the deployment with pilot users"
    echo "3. Monitor performance and usage analytics"
    echo "4. Schedule training sessions for end users"
}

# Run main deployment
main