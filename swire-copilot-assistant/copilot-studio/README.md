# Microsoft Copilot Studio Configuration

This directory contains the configuration files and setup scripts for the Swire Intelligence Assistant built on Microsoft Copilot Studio.

## Overview

The Swire Intelligence Assistant is configured with the following components:

- **Conversation Topics**: Pre-built topics for Finance, HSE, HR, and Document Search
- **Azure OpenAI Integration**: GPT-4 model for natural language processing
- **Multi-channel Support**: Microsoft Teams and Power BI integration
- **Security Configuration**: Azure AD authentication and role-based access
- **Analytics & Monitoring**: Conversation analytics and performance tracking

## Files Structure

```
copilot-studio/
├── bot-configuration.json          # Main copilot configuration
├── setup-copilot-studio.ps1       # PowerShell setup script
├── topics/                         # Conversation topic definitions
│   ├── greeting-topic.yaml         # Welcome and help messages
│   ├── finance-topic.yaml          # Financial data queries
│   ├── hse-topic.yaml             # Health, Safety & Environment
│   ├── hr-topic.yaml              # Human Resources analytics
│   ├── document-search-topic.yaml # Knowledge base search
│   └── fallback-topic.yaml        # Unrecognized intent handling
└── README.md                      # This file
```

## Prerequisites

Before setting up the copilot, ensure you have:

1. **Power Platform CLI** installed

   ```powershell
   # Install via PowerShell
   Install-Module -Name Microsoft.PowerApps.Administration.PowerShell
   Install-Module -Name Microsoft.PowerApps.PowerShell

   # Or download from: https://aka.ms/PowerPlatformCLI
   ```

2. **Azure Resources** deployed (from infrastructure setup)
   - Azure OpenAI Service
   - Azure Cognitive Search
   - Azure Key Vault

3. **Permissions**
   - Power Platform Administrator or Environment Maker role
   - Azure OpenAI Service access
   - Microsoft 365 tenant with Teams and Power BI

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file with your specific values:

```powershell
# Copy from template
cp ../infrastructure/.env.template .env

# Edit with your values
$TENANT_ID = "your-tenant-id"
$ENVIRONMENT_URL = "https://your-environment.crm.dynamics.com/"
$OPENAI_ENDPOINT = "https://swire-copilot-dev-openai.openai.azure.com/"
```

### 2. Run Setup Script

Execute the PowerShell setup script:

```powershell
# Navigate to copilot-studio directory
cd copilot-studio

# Run setup (replace with your actual values)
.\setup-copilot-studio.ps1 `
    -Environment "dev" `
    -TenantId "your-tenant-id" `
    -EnvironmentUrl "https://your-environment.crm.dynamics.com/"
```

### 3. Manual Configuration Steps

After running the script, complete these manual steps in Copilot Studio:

1. **Verify Azure OpenAI Connection**
   - Go to Copilot Studio > Settings > AI capabilities
   - Confirm Azure OpenAI endpoint and model deployment
   - Test the connection

2. **Configure Knowledge Base**
   - Navigate to Knowledge > Data sources
   - Add Azure Cognitive Search as a data source
   - Configure search index and semantic settings

3. **Set Up Authentication**
   - Go to Settings > Security
   - Configure Azure AD authentication
   - Set up role-based access control

4. **Test Conversation Flow**
   - Use the Test bot panel
   - Try sample queries for each topic
   - Verify responses and data integration

## Conversation Topics

### Greeting Topic

- Handles initial user interactions
- Provides guidance and suggested actions
- Sets conversation context

### Finance Topic

- Revenue and expense queries
- Budget variance analysis
- KPI performance metrics
- Financial trend analysis

### HSE Topic

- Safety incident reports
- Compliance status and metrics
- Environmental data analysis
- Trend identification and insights

### HR Topic

- Workforce analytics and metrics
- Attendance and productivity data
- Training completion status
- Department-wise breakdowns

### Document Search Topic

- Knowledge base search functionality
- Document categorization and filtering
- Recent and popular document access
- Search result ranking and highlighting

### Fallback Topic

- Handles unrecognized intents
- Provides helpful suggestions
- Escalation to human support
- Feedback collection

## Configuration Details

### Azure OpenAI Integration

```json
{
  "azureOpenAI": {
    "endpoint": "https://swire-copilot-dev-openai.openai.azure.com/",
    "deployment": "gpt-4",
    "apiVersion": "2023-12-01-preview",
    "maxTokens": 4000,
    "temperature": 0.3,
    "systemPrompt": "You are the Swire Intelligence Assistant..."
  }
}
```

### Security Settings

```json
{
  "security": {
    "authenticationRequired": true,
    "authProvider": "AzureAD",
    "roleBasedAccess": true,
    "auditLogging": true,
    "dataClassification": "Internal"
  }
}
```

### Channel Configuration

```json
{
  "channels": [
    {
      "name": "Microsoft Teams",
      "enabled": true,
      "configuration": {
        "adaptiveCards": true,
        "proactiveMessaging": true,
        "fileUpload": true,
        "voiceInput": true
      }
    }
  ]
}
```

## Testing and Validation

### Basic Functionality Test

1. **Greeting Test**

   ```
   User: "Hello"
   Expected: Welcome message with suggested actions
   ```

2. **Finance Query Test**

   ```
   User: "Show me this month's revenue"
   Expected: Financial data with charts and metrics
   ```

3. **Document Search Test**
   ```
   User: "Find safety procedures"
   Expected: Relevant documents with excerpts
   ```

### Integration Testing

1. **Azure OpenAI Connection**
   - Verify natural language understanding
   - Check response quality and relevance
   - Test conversation context retention

2. **Data Connector Testing**
   - Test finance data retrieval
   - Verify HSE database connectivity
   - Check HR system integration

3. **Security Testing**
   - Verify authentication flow
   - Test role-based access control
   - Check audit logging functionality

## Troubleshooting

### Common Issues

1. **Authentication Failures**

   ```
   Error: "Unable to authenticate to Power Platform"
   Solution: Check tenant ID and user permissions
   ```

2. **Azure OpenAI Connection Issues**

   ```
   Error: "Failed to connect to Azure OpenAI"
   Solution: Verify endpoint URL and API key
   ```

3. **Topic Import Failures**
   ```
   Error: "Failed to import conversation topic"
   Solution: Check YAML syntax and file paths
   ```

### Debugging Steps

1. **Check Copilot Studio Logs**
   - Navigate to Analytics > Conversation transcripts
   - Review error messages and conversation flows

2. **Verify Resource Connections**
   - Test Azure OpenAI endpoint manually
   - Check Cognitive Search index status
   - Validate Power Platform connector health

3. **Review Security Settings**
   - Confirm user roles and permissions
   - Check conditional access policies
   - Verify authentication configuration

## Next Steps

After successful setup:

1. **Configure Power Platform Connectors** (Task 3)
2. **Set up Teams Integration** (Task 6)
3. **Implement Power BI Integration** (Task 7)
4. **Deploy to Production Environment**

## Support

For technical support:

- **Copilot Studio Documentation**: https://docs.microsoft.com/copilot-studio/
- **Power Platform Community**: https://powerusers.microsoft.com/
- **Swire IT Support**: it-support@swire.com
