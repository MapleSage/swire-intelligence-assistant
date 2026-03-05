# SageGreen AI Assistant

Enterprise ESG and Renewable Energy AI assistant with multi-agent orchestration and Azure-powered RAG pipeline.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                    https://sagegreen.vercel.app                  │
└────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Chat Request   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PRIMARY    │    │   FALLBACK   │    │ LAST RESORT  │
│              │    │              │    │              │
│  Azure AI    │───▶│   FastAPI    │───▶│   Cached     │
│  + GPT-4o    │    │  Multi-Agent │    │  Responses   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 🔄 Chat Flow

### 1. PRIMARY: Azure OpenAI with Cognitive Search
- **Endpoint**: `/api/azure-kb-chat`
- **Model**: GPT-4o via Azure OpenAI
- **Knowledge Base**: Azure Cognitive Search
- **Indices**:
  - `swire-wind-services` (37 documents)
  - `swire-knowledge-index`
- **RAG**: Semantic search with vector embeddings
- **Fallback Trigger**: API errors or unavailable service

### 2. FALLBACK: FastAPI Multi-Agent System
- **Endpoint**: `http://localhost:8000/chat`
- **Architecture**: Multi-agent orchestration
- **Components**:
  - `MultiAgentOrchestrator` - Routes queries to specialist agents
  - `SwireSpecialistAgent` - Domain experts (wind, solar, ops, safety, finance)
  - `RAGPipeline` - FAISS vector search on local documents
  - `AzureOpenAIClient` - Direct Azure OpenAI invocation

### 3. LAST RESORT: Cached Responses
- Hardcoded responses for common queries
- CEO/leadership information
- Financial summaries
- Safety protocols

## 📊 Knowledge Base Architecture

### Azure Cognitive Search (Primary)
```
Search Service: ai-parvinddutta9607ai577068173144.search.windows.net
├── Resource Group: swire-rg (East US)
├── Subscription: Azure subscription 1
├── Indices:
│   ├── swire-wind-services (37 documents)
│   └── swire-knowledge-index
└── Integration: Azure OpenAI embeddings
```

### Local FAISS Vector Store (FastAPI Fallback)
```
Location: swire-agent-core/data/vector_index
├── Model: sentence-transformers/all-MiniLM-L6-v2
├── Documents: data/docs/*.pdf, *.txt
└── Used by: RAGPipeline in FastAPI fallback
```

## 🤖 Multi-Agent System

### Agent Orchestrator
**File**: `swire-agent-core/src/agents/multi_agent_orchestrator.py`

**Capabilities**:
- Query complexity analysis
- Multi-domain detection (finance, safety, operations, wind, solar)
- Agent collaboration and synthesis
- Dashboard generation

### Specialist Agents
**File**: `swire-agent-core/src/agents/swire_specialist_agent.py`

**Domains**:
1. **Wind Energy**: Turbine maintenance, performance metrics, renewable projects
2. **Solar Energy**: Panel cleaning, inverter monitoring, solar installations
3. **ESG Compliance**: Environmental impact, sustainability metrics, carbon footprint
4. **Safety**: PPE requirements, incident reporting, regulatory compliance
5. **Finance**: Budget categories, KPI metrics, ESG investments

## 🔧 Backend Components

### FastAPI Application
**File**: `swire-agent-core/app.py`
```python
# Endpoints
POST /chat          # Main chat endpoint
GET  /health        # Health check
GET  /              # API info
```

### Tools & Integrations
```
swire-agent-core/src/tools/
├── finance.py      # Financial data retrieval
├── knowledge.py    # KB search + CEO info
├── hse.py          # Safety data
└── db_connector.py # Database connections
```

### Core Modules
```
swire-agent-core/src/core/
├── agent_core.py           # Langchain-based agent
├── azure_agent_core.py     # Azure OpenAI integration
├── rag_pipeline.py         # FAISS vector search
└── simple_agent_core.py    # Lightweight fallback
```

## 🌐 Deployment

### Frontend (Vercel)
- **URL**: https://sagegreen.vercel.app
- **Framework**: Next.js 14.2.33
- **Auto-deploy**: GitHub main branch
- **Build**: `npm run build`

### Backend (Azure Container Instances)
- **Container**: swire-agent-api
- **Resource Group**: swire-rg (East US)
- **Public IP**: 20.72.179.10
- **FQDN**: swire-intelligence.eastus.azurecontainer.io
- **Status**: Running
- **OS**: Linux
- **Endpoints**:
  - Health: `http://20.72.179.10/health`
  - Chat: `http://20.72.179.10/chat`

### Local Development (Optional)
```bash
cd swire-agent-core
pip install -r requirements.txt
python app.py  # Runs on port 8000
```

## 📦 Environment Variables

### Frontend (.env.local)
```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***
AZURE_SEARCH_INDEX=swire-wind-services

# Backend
NEXT_PUBLIC_BACKEND_URL=http://20.72.179.10
# For local development: http://localhost:8000
```

### Backend (.env)
```bash
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/MapleSage/swire-intelligence-assistant.git
cd swire-intelligence-assistant
```

### 2. Start Backend (Optional - for fallback)
```bash
cd swire-agent-core
pip install -r requirements.txt
python app.py
```

### 3. Start Frontend
```bash
cd swire-frontend
npm install
npm run dev
```

### 4. Access Application
- Local: http://localhost:3000
- Production: https://sagegreen.vercel.app

## 🐳 Container-First Workflow (Recommended)

### 1. Configure Environment
```bash
cp .env.example .env
# fill Azure keys/endpoints in .env
```

### 2. Start App Stack Locally (Frontend + Backend)
```bash
docker compose up --build
```

### 3. Ingest Operations Manuals to Blob + Vector Search
Place your manuals under `./enterprise-data` with department folders, then run:
```bash
docker compose --profile ingest run --rm data-ingest
```

This uploads source files to Azure Blob Storage and writes vectorized chunks into `AZURE_SEARCH_INDEX`.

### 4. Deploy Containers to Azure App Service
```bash
./deploy_to_azure.sh
```

## 📝 Knowledge Base Management

### Update Azure Cognitive Search Index
```bash
# Upload documents via Azure Portal or SDK
# Navigate to: Azure Portal > swire-rg > Cognitive Search
# Upload to index: swire-wind-services or swire-knowledge-index
```

### Verify Index Contents
```bash
# Via Azure Portal
# Navigate to: Search Service > Indexes > swire-wind-services > Search Explorer
```

## 🧪 Testing

### Test Azure OpenAI + Cognitive Search
```bash
curl -X POST http://localhost:3000/api/azure-kb-chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about wind energy services"}'
```

### Test Azure Container Instance (FastAPI)
```bash
# Health check
curl http://20.72.179.10/health

# Chat endpoint
curl -X POST http://20.72.179.10/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about wind energy services"}'
```

### Test Local FastAPI (Development)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about wind energy services"}'
```

## 📊 System Status

### Active Services
- ✅ Azure OpenAI (GPT-4o)
- ✅ Azure Cognitive Search (swire-wind-services)
- ✅ Next.js Frontend (Vercel)
- ✅ FastAPI Backend (Azure Container Instance - swire-agent-api)
- ✅ Multi-Agent Orchestrator

## 🌍 Azure Resources

### Resource Group: swire-copilot-dev-rg
- **Region**: West Europe
- **Subscription**: Azure subscription 1
- **Purpose**: Development environment

### Resource Group: swire-rg
- **Region**: East US
- **Subscription**: Azure subscription 1
- **Resources**:
  - Azure OpenAI Service
  - Cognitive Search Service (ai-parvinddutta9607ai577068173144)
  - Search Indices (swire-wind-services, swire-knowledge-index)
  - Container Instance: swire-agent-api (20.72.179.10)

## 🔍 Troubleshooting

### Azure OpenAI Not Responding
- Check deployment name matches environment variable
- Verify API key is valid
- Check quota limits in Azure Portal

### Cognitive Search Empty Results
- Verify index has documents via Search Explorer
- Check query syntax and field mappings
- Ensure embeddings are properly configured

### Azure Container Instance Not Responding
```bash
# Check health endpoint
curl http://20.72.179.10/health

# Restart via Azure Portal
# Navigate to: Azure Portal > swire-rg > swire-agent-api > Restart

# Check logs via Azure Portal
# Navigate to: Azure Portal > swire-agent-api > Containers > Logs
```

### Local FastAPI Not Responding (Development)
```bash
# Check if running
ps aux | grep "python app.py"

# Restart
cd swire-agent-core
python app.py
```

### Knowledge Base Empty
- Navigate to Azure Portal
- Go to Cognitive Search Service
- Upload documents to appropriate index
- Rebuild index if necessary

## 📚 Documentation

- [Azure OpenAI Docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Cognitive Search Docs](https://learn.microsoft.com/en-us/azure/search/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Langchain Docs](https://python.langchain.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Push to GitHub (auto-deploys to Vercel)

## 📄 License

Proprietary - SageGreen AI

---

**Last Updated**: December 27, 2025
**Version**: 3.0.0
**Status**: Production (Azure-only)
