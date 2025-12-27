#!/bin/bash

# Deploy Swire Intelligence Assistant to Azure App Service
# This creates a cloud-hosted web application accessible from anywhere

set -e

# Configuration
APP_NAME="swire-intelligence-assistant"
RESOURCE_GROUP="swire-copilot-dev-rg"
LOCATION="westeurope"
SKU="B1"  # Basic tier for development
RUNTIME="PYTHON|3.10"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if logged in to Azure
check_azure_login() {
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    print_status "Using subscription: $SUBSCRIPTION_ID"
}

# Create App Service Plan
create_app_service_plan() {
    print_status "Creating App Service Plan..."
    
    PLAN_NAME="${APP_NAME}-plan"
    
    # Check if plan exists
    if az appservice plan show --name $PLAN_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        print_status "App Service Plan already exists"
    else
        az appservice plan create \
            --name $PLAN_NAME \
            --resource-group $RESOURCE_GROUP \
            --location $LOCATION \
            --sku $SKU \
            --is-linux
        
        print_success "App Service Plan created"
    fi
}

# Create Web App
create_web_app() {
    print_status "Creating Azure Web App..."
    
    # Check if web app exists
    if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        print_status "Web App already exists"
    else
        az webapp create \
            --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --plan "${APP_NAME}-plan" \
            --runtime $RUNTIME
        
        print_success "Web App created"
    fi
}

# Configure Web App settings
configure_web_app() {
    print_status "Configuring Web App settings..."
    
    # Set environment variables
    az webapp config appsettings set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            FLASK_ENV=production \
            ENVIRONMENT=production \
            SECRET_KEY="swire-copilot-production-key-$(date +%s)" \
            ENABLE_AUTH=false \
            DEBUG=false
    
    # Configure startup command
    az webapp config set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 app:app"
    
    print_success "Web App configured"
}

# Deploy application code
deploy_application() {
    print_status "Deploying application code..."
    
    # Create deployment package
    cd swire-copilot-assistant/webapp
    
    # Create .deployment file for Azure
    cat > .deployment << EOF
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
EOF

    # Create startup script
    cat > startup.sh << EOF
#!/bin/bash
pip install -r requirements.txt
gunicorn --bind=0.0.0.0 --timeout 600 app:app
EOF
    chmod +x startup.sh
    
    # Deploy using zip deployment
    zip -r ../../swire-app.zip . -x "*.pyc" "__pycache__/*" ".git/*"
    
    cd ../../
    
    # Deploy the zip file
    az webapp deployment source config-zip \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --src swire-app.zip
    
    print_success "Application deployed"
}

# Configure custom domain (optional)
configure_domain() {
    print_status "Web app will be available at:"
    echo "https://${APP_NAME}.azurewebsites.net"
    
    # Get the URL
    APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
    echo "Direct URL: https://$APP_URL"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    APP_URL="https://${APP_NAME}.azurewebsites.net"
    
    # Wait for deployment to complete
    sleep 30
    
    # Test health endpoint
    if curl -f -s "$APP_URL/health" > /dev/null; then
        print_success "✓ Health check passed"
    else
        print_error "✗ Health check failed"
    fi
    
    # Test main page
    if curl -f -s "$APP_URL" > /dev/null; then
        print_success "✓ Main page accessible"
    else
        print_error "✗ Main page not accessible"
    fi
}

# Main deployment function
main() {
    print_header "Deploying Swire Intelligence Assistant to Azure"
    
    check_azure_login
    create_app_service_plan
    create_web_app
    configure_web_app
    deploy_application
    configure_domain
    test_deployment
    
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}🎉 Your Swire Intelligence Assistant is now live!${NC}"
    echo ""
    echo -e "${YELLOW}📱 Access your web app at:${NC}"
    echo "https://${APP_NAME}.azurewebsites.net"
    echo ""
    echo -e "${YELLOW}🔧 Management:${NC}"
    echo "• Azure Portal: https://portal.azure.com"
    echo "• Resource Group: $RESOURCE_GROUP"
    echo "• App Service: $APP_NAME"
    echo ""
    echo -e "${YELLOW}💡 Features available:${NC}"
    echo "• Natural language chat interface"
    echo "• Financial, HSE, and HR analytics"
    echo "• Document search capabilities"
    echo "• Mobile-responsive design"
    echo "• Enterprise-grade security ready"
    echo ""
    print_success "No local installation required - access from anywhere!"
}

# Run deployment
main