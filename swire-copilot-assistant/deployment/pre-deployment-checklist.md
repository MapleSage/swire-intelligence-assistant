# Pre-Deployment Checklist for Swire Intelligence Assistant

## 🔍 Prerequisites Verification

Before running the deployment, ensure you have the following:

### 1. **Azure Environment**

- [ ] Azure subscription with appropriate permissions
- [ ] Subscription has Azure OpenAI Service access approved
- [ ] Global Administrator or equivalent permissions in Azure AD
- [ ] Resource creation permissions in target subscription

### 2. **Microsoft 365 & Power Platform**

- [ ] Microsoft 365 tenant with Teams and Power BI licenses
- [ ] Power Platform environment with appropriate capacity
- [ ] Teams app deployment permissions
- [ ] Power BI Pro or Premium licenses for users

### 3. **Required Software**

- [ ] Azure CLI installed and updated (`az --version`)
- [ ] PowerShell Core installed (`pwsh --version`)
- [ ] Power Platform CLI installed (`pac --version`)
- [ ] Node.js installed for Power BI visual build (`node --version`)
- [ ] Git for version control

### 4. **Authentication Setup**

- [ ] Logged into Azure CLI (`az login`)
- [ ] Logged into Power Platform CLI (`pac auth create`)
- [ ] Appropriate tenant permissions verified

## 📋 Configuration Requirements

### 1. **Environment Variables**

Create a `.env` file with the following values:

```bash
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_LOCATION=westeurope

# Environment Settings
ENVIRONMENT=dev  # or prod
RESOURCE_PREFIX=swire-copilot

# Microsoft 365 Configuration
TEAMS_TENANT_ID=your-m365-tenant-id
POWER_PLATFORM_ENVIRONMENT_URL=https://your-env.crm4.dynamics.com/

# API Endpoints (to be configured post-deployment)
FINANCE_API_ENDPOINT=https://your-finance-api.com
HSE_DATABASE_CONNECTION=your-hse-db-connection
HR_GRAPH_SCOPE=https://graph.microsoft.com/.default
```

### 2. **Network Configuration**

- [ ] Firewall rules allow Azure CLI access
- [ ] Corporate proxy settings configured if required
- [ ] VPN connection to corporate network if needed

### 3. **Capacity Planning**

- [ ] Azure subscription has sufficient quota for:
  - Cognitive Services (OpenAI)
  - Search Services
  - Storage Accounts
  - Key Vault instances
- [ ] Power Platform environment has adequate capacity

## 🔐 Security Considerations

### 1. **Access Control**

- [ ] Identify users who will have access to the assistant
- [ ] Define role-based access control (RBAC) requirements
- [ ] Plan conditional access policies
- [ ] Determine data classification levels

### 2. **Compliance Requirements**

- [ ] Verify EU data residency requirements
- [ ] Confirm GDPR compliance needs
- [ ] Review industry-specific regulations
- [ ] Plan audit logging requirements

### 3. **Data Sources**

- [ ] Identify all enterprise data sources to connect
- [ ] Verify API access and authentication methods
- [ ] Plan data refresh schedules
- [ ] Determine data retention policies

## 📊 Integration Planning

### 1. **SharePoint Integration**

- [ ] Identify SharePoint sites for document indexing
- [ ] Plan document library structure
- [ ] Configure permissions for service accounts
- [ ] Test document upload and sync processes

### 2. **Teams Deployment**

- [ ] Plan Teams app distribution strategy
- [ ] Identify pilot user groups
- [ ] Configure Teams policies and permissions
- [ ] Plan user training and adoption

### 3. **Power BI Integration**

- [ ] Identify reports for chat integration
- [ ] Plan custom visual deployment
- [ ] Configure workspace permissions
- [ ] Test embedded chat functionality

## 🧪 Testing Strategy

### 1. **Pre-Deployment Testing**

- [ ] Validate Azure resource deployment scripts
- [ ] Test Copilot Studio configuration
- [ ] Verify Teams app manifest
- [ ] Check Power BI visual build process

### 2. **Post-Deployment Testing**

- [ ] End-to-end conversation testing
- [ ] Data connector functionality
- [ ] Security and access control
- [ ] Performance and scalability

### 3. **User Acceptance Testing**

- [ ] Pilot user group identified
- [ ] Test scenarios documented
- [ ] Feedback collection process planned
- [ ] Success criteria defined

## 📞 Support & Rollback Planning

### 1. **Support Structure**

- [ ] Technical support team identified
- [ ] Escalation procedures documented
- [ ] User training materials prepared
- [ ] Help desk procedures updated

### 2. **Rollback Plan**

- [ ] Backup procedures for existing systems
- [ ] Rollback scripts prepared
- [ ] Communication plan for issues
- [ ] Recovery time objectives defined

### 3. **Monitoring Setup**

- [ ] Application Insights configuration
- [ ] Performance monitoring dashboards
- [ ] Usage analytics tracking
- [ ] Error alerting and notification

## ✅ Final Verification

Before proceeding with deployment:

- [ ] All prerequisites are met
- [ ] Configuration files are prepared
- [ ] Testing strategy is documented
- [ ] Support team is ready
- [ ] Rollback plan is in place
- [ ] Stakeholder approval obtained

## 🚀 Deployment Command

Once all checklist items are complete, run:

```bash
cd swire-copilot-assistant/deployment
./deploy.sh dev  # or prod for production
```

## 📋 Post-Deployment Tasks

After successful deployment:

1. **Immediate (Day 1)**
   - [ ] Verify all Azure resources are running
   - [ ] Test basic Copilot Studio functionality
   - [ ] Upload Teams app to pilot users
   - [ ] Configure initial data connectors

2. **Short-term (Week 1)**
   - [ ] Complete Power Platform connector configuration
   - [ ] Deploy Power BI custom visual
   - [ ] Conduct pilot user training
   - [ ] Monitor initial usage and performance

3. **Medium-term (Month 1)**
   - [ ] Analyze usage patterns and feedback
   - [ ] Optimize conversation topics
   - [ ] Expand to additional user groups
   - [ ] Fine-tune performance and responses

4. **Long-term (Ongoing)**
   - [ ] Regular model updates and improvements
   - [ ] Expand data source integrations
   - [ ] Enhance conversation capabilities
   - [ ] Monitor compliance and security

---

**Important**: This checklist ensures a smooth deployment process. Complete all items before proceeding with the deployment script.
