# Swire Intelligence Assistant - Azure Deployment Plan

## Current State

### Existing Deployments
1. **SageGreen Frontend**: esg.sagesure.io (Vercel)
2. **Backend API**: Azure Container Instance at 20.72.179.10
3. **VBMS**: vbms-app.azurewebsites.net (working with AI assistant)

### Current Architecture
- Frontend: Next.js on Vercel
- Backend: FastAPI on Azure Container Instance (swire-agent-api)
- AI: Azure OpenAI (GPT-4o) + Azure Cognitive Search
- Knowledge Base: swire-wind-services index (37 documents)

## New Deployment: Swire Intelligence Assistant

### Goals
1. Rebrand from "SageGreen" to "Swire Intelligence Assistant"
2. Deploy to Azure App Service (like VBMS)
3. Add operations manual & HR policy capabilities
4. Integrate with Copilot Studio
5. Professional Swire branding

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│           Swire Intelligence Assistant (Azure)                   │
│                                                                   │
│  swire-intelligence.azurewebsites.net                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Next.js    │  │   FastAPI    │  │  Azure AI    │
│   Frontend   │  │   Backend    │  │  Services    │
│              │  │              │  │              │
│  App Service │  │  Container   │  │  OpenAI +    │
│  (Static)    │  │  Instance    │  │  Search      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Deployment Steps

### Phase 1: Rebrand Frontend

**Update**: `swire-frontend/`

1. **Change branding**:
   - Replace "SageGreen" with "Swire Intelligence Assistant"
   - Update logo to Swire Renewable logo
   - Change color scheme to Swire brand colors

2. **Update environment variables**:
```env
# .env.local
NEXT_PUBLIC_APP_NAME="Swire Intelligence Assistant"
NEXT_PUBLIC_API_URL=http://20.72.179.10
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***
AZURE_SEARCH_INDEX=swire-wind-services
```

3. **Add new features**:
   - Operations manual search
   - HR policy queries
   - Department-specific knowledge

### Phase 2: Deploy Frontend to Azure

**Option A: Azure Static Web Apps** (Recommended)
```bash
cd swire-frontend

# Build
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name swire-intelligence \
  --resource-group swire-rg \
  --source . \
  --location eastus \
  --branch main \
  --app-location "/" \
  --output-location "out"
```

**Option B: Azure App Service**
```bash
# Create App Service Plan (if not exists)
az appservice plan create \
  --name swire-intelligence-plan \
  --resource-group swire-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group swire-rg \
  --plan swire-intelligence-plan \
  --name swire-intelligence \
  --runtime "NODE:18-lts"

# Deploy
cd swire-frontend
npm run build
az webapp deployment source config-zip \
  --resource-group swire-rg \
  --name swire-intelligence \
  --src build.zip
```

### Phase 3: Update Backend

**Add Operations Manual Agent**:

File: `swire-agent-core/src/agents/operations_agent.py`

```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

class OperationsAgent:
    """Agent for operations manuals and HR policies"""
    
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.project_client = AIProjectClient(
            endpoint="https://swirere-3699-resource.services.ai.azure.com",
            subscription_id="2bfa9715-785b-445f-8102-6a423a7495ef",
            resource_group_name="swire-rg",
            project_name="swirere-3699",
            credential=self.credential
        )
        self.agent_name = "swire-gpt-4o"
    
    def query(self, question: str, department: str = None) -> dict:
        """
        Query operations manuals and HR policies
        
        Args:
            question: User question
            department: Optional department filter (blades, pre_assembly, etc.)
        
        Returns:
            Response with answer and sources
        """
        # Use Azure AI Agent Service
        # Filter by department if specified
        # Return structured response
        pass
```

**Update Multi-Agent Orchestrator**:

File: `swire-agent-core/src/agents/multi_agent_orchestrator.py`

```python
from .operations_agent import OperationsAgent

class MultiAgentOrchestrator:
    def __init__(self):
        # ... existing agents ...
        self.operations_agent = OperationsAgent()
        
    def route_query(self, query: str) -> dict:
        """Route query to appropriate agent"""
        
        # Check for operations/HR keywords
        ops_keywords = [
            "operations", "manual", "procedure", "hr", "policy",
            "blade", "installation", "maintenance", "safety",
            "vacation", "training", "certification"
        ]
        
        if any(kw in query.lower() for kw in ops_keywords):
            return self.operations_agent.query(query)
        
        # ... existing routing logic ...
```

### Phase 4: Add Operations Documents

**Upload to Azure Cognitive Search**:

```bash
cd swire-intelligence-assistant

# Create new index for operations manuals
az search index create \
  --service-name ai-parvinddutta9607ai577068173144 \
  --resource-group swire-rg \
  --name swire-operations-manuals

# Upload documents
python upload-operations-docs.py
```

**Document Structure**:
```
operations-docs/
├── blades/
│   ├── safety_procedures.pdf
│   ├── quality_standards.pdf
│   └── maintenance_guide.pdf
├── pre_assembly_installation/
│   ├── site_preparation.pdf
│   └── installation_procedures.pdf
├── service_maintenance/
│   ├── maintenance_schedules.pdf
│   └── troubleshooting_guide.pdf
└── hr/
    ├── hr_policies.pdf
    ├── employee_handbook.pdf
    └── training_requirements.pdf
```

### Phase 5: Integrate with Copilot Studio

**Create Power Virtual Agent**:

1. Go to Copilot Studio
2. Create new copilot: "Swire Intelligence Assistant"
3. Add topics:
   - Operations Manual Search
   - HR Policy Queries
   - ESG & Renewable Energy
   - Financial Data
   - Safety Guidelines

**Connect to Backend**:

```yaml
# Copilot Studio - Custom Action
name: Query Swire Intelligence
endpoint: http://20.72.179.10/chat
method: POST
body:
  query: ${user_query}
  context: ${conversation_context}
```

**Deploy to Teams**:
- Publish copilot
- Add to Teams app catalog
- Configure permissions

### Phase 6: Custom Domain & SSL

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name swire-intelligence \
  --resource-group swire-rg \
  --hostname intelligence.swirerenewable.com

# Enable SSL
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name swire-intelligence \
  --resource-group swire-rg
```

## Configuration Files

### Frontend Environment Variables

Create `swire-frontend/.env.production`:

```env
NEXT_PUBLIC_APP_NAME=Swire Intelligence Assistant
NEXT_PUBLIC_API_URL=http://20.72.179.10
NEXT_PUBLIC_ENABLE_OPERATIONS=true
NEXT_PUBLIC_ENABLE_HR=true
NEXT_PUBLIC_ENABLE_ESG=true

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***
AZURE_SEARCH_INDEX_ESG=swire-wind-services
AZURE_SEARCH_INDEX_OPS=swire-operations-manuals
```

### Backend Environment Variables

Update `swire-agent-core/.env`:

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***

# Azure AI Agent Service
AZURE_AI_PROJECT_ENDPOINT=https://swirere-3699-resource.services.ai.azure.com
AZURE_AI_SUBSCRIPTION_ID=2bfa9715-785b-445f-8102-6a423a7495ef
AZURE_AI_RESOURCE_GROUP=swire-rg
AZURE_AI_PROJECT_NAME=swirere-3699
AZURE_AI_AGENT_NAME=swire-gpt-4o
```

## Testing Plan

### Unit Tests
```bash
cd swire-agent-core
pytest tests/test_operations_agent.py
pytest tests/test_multi_agent_orchestrator.py
```

### Integration Tests
```bash
# Test operations queries
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the blade handling safety procedures?"}'

# Test HR queries
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the vacation policy?"}'

# Test ESG queries
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about wind energy services"}'
```

### End-to-End Tests
1. Deploy to staging environment
2. Test all query types
3. Verify Copilot Studio integration
4. Test Teams integration
5. Performance testing

## Deployment Commands

### Quick Deploy Script

Create `deploy-swire-intelligence.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Swire Intelligence Assistant"

# 1. Build frontend
echo "📦 Building frontend..."
cd swire-frontend
npm install
npm run build

# 2. Deploy frontend to Azure
echo "🌐 Deploying frontend..."
az webapp deployment source config-zip \
  --resource-group swire-rg \
  --name swire-intelligence \
  --src build.zip

# 3. Restart backend (if needed)
echo "🔄 Restarting backend..."
az container restart \
  --resource-group swire-rg \
  --name swire-agent-api

# 4. Verify deployment
echo "✅ Verifying deployment..."
curl https://swire-intelligence.azurewebsites.net/health

echo "🎉 Deployment complete!"
echo "🌐 Frontend: https://swire-intelligence.azurewebsites.net"
echo "🔗 Backend: http://20.72.179.10"
```

## Monitoring & Maintenance

### Application Insights

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app swire-intelligence-insights \
  --location eastus \
  --resource-group swire-rg

# Link to web app
az webapp config appsettings set \
  --resource-group swire-rg \
  --name swire-intelligence \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>
```

### Alerts

- Response time > 2 seconds
- Error rate > 1%
- Container restart
- High memory usage

## Cost Estimate

- Frontend (App Service B1): ~$13/month
- Backend (Container Instance): ~$30/month
- Azure OpenAI: ~$50-100/month (usage-based)
- Azure Cognitive Search: ~$75/month (Basic tier)
- **Total: ~$170-220/month**

## Timeline

- **Week 1**: Rebrand frontend, add operations features
- **Week 2**: Deploy to Azure, test integration
- **Week 3**: Copilot Studio integration, Teams deployment
- **Week 4**: User testing, documentation, training

## Next Steps

1. Update frontend branding
2. Add operations agent to backend
3. Upload operations documents
4. Deploy to Azure
5. Test end-to-end
6. Copilot Studio integration
7. User training

---

**Created**: March 3, 2026
**Status**: Ready to Deploy
**Owner**: Swire IT Team
