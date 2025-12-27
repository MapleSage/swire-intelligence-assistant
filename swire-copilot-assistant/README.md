# Swire Intelligence Assistant

A new enterprise AI assistant built on Microsoft Copilot Studio and Azure OpenAI Service for Swire Renewables, ensuring EU data compliance and seamless Microsoft 365 integration.

## Overview

This application runs independently from the existing SageGreen system (Renewable Energy & ESG Intelligence) and provides comprehensive enterprise data access through natural language conversations in Microsoft Teams and Power BI.

## Architecture

- **Microsoft Copilot Studio**: Conversation orchestration and topic management
- **Azure OpenAI Service**: EU-compliant AI processing (West Europe region)
- **Azure Cognitive Search**: Knowledge base and document retrieval
- **Power Platform**: Data connectors for Finance, HSE, and HR systems
- **Microsoft Teams**: Primary user interface
- **Power BI**: Embedded chat widgets for contextual insights

## Key Features

- EU data residency compliance
- Enterprise-grade security with Azure AD integration
- Multi-domain analytics (Finance, HSE, HR)
- Mobile accessibility through Teams
- Real-time document processing and indexing
- Role-based access control

## Project Structure

```
swire-copilot-assistant/
├── infrastructure/          # Azure infrastructure as code
├── copilot-studio/         # Copilot Studio configuration files
├── power-platform/         # Power Platform connectors and flows
├── teams-integration/      # Teams app manifest and configuration
├── powerbi-integration/    # Power BI custom visuals and components
├── docs/                   # Documentation and user guides
└── scripts/               # Deployment and utility scripts
```

## Getting Started

1. **Prerequisites**
   - Azure subscription with appropriate permissions
   - Microsoft 365 tenant with Teams and Power BI
   - Power Platform environment
   - Azure CLI installed

2. **Infrastructure Setup**

   ```bash
   cd infrastructure
   ./deploy-azure-resources.sh
   ```

3. **Copilot Studio Configuration**
   - Import conversation topics from `copilot-studio/topics/`
   - Configure Azure OpenAI integration
   - Set up Power Platform connectors

4. **Teams Deployment**
   - Upload Teams app manifest
   - Configure permissions and policies

## Security & Compliance

- All data processing occurs within EU Azure regions
- Customer-managed encryption keys
- Comprehensive audit logging
- GDPR compliance with data retention policies
- Conditional access and DLP policies

## Support

For technical support and documentation, see the `docs/` directory or contact the Swire IT team.
