# Swire Intelligence Assistant

Enterprise AI assistant with multi-agent orchestration, RAG pipeline, and multi-cloud knowledge base integration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                    https://sagegreen.vercel.app                  │
└────────────────────────────┬────────────────────────────────────┘
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
│  Bedrock KB  │───▶│   FastAPI    │───▶│   Cached     │
│  + Claude    │    │  Multi-Agent │    │  Responses   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 🔄 Chat Flow

### 1. PRIMARY: AWS Bedrock Knowledge Base
- **Endpoint**: `/api/bedrock-agent`
- **Model**: Claude 3 Sonnet via Bedrock
- **Knowledge Base**: `BELWMDUYUJ` (OpenSearch Serverless)
- **Data Source**: S3 bucket `bedrock-agent-kb-swire`
- **RAG**: RetrieveAndGenerateCommand with semantic search
- **Fallback Trigger**: Claude content filter or API errors

### 2. FALLBACK: FastAPI Multi-Agent System
- **Endpoint**: `http://localhost:8000/chat`
- **Architecture**: Multi-agent orchestration
- **Components**:
  - `MultiAgentOrchestrator` - Routes queries to specialist agents
  - `SwireSpecialistAgent` - Domain experts (wind, solar, ops, safety, finance)
  - `RAGPipeline` - FAISS vector search on local documents
  - `BedrockClient` - Direct Bedrock model invocation

### 3. LAST RESORT: Cached Responses
- Hardcoded responses for common queries
- CEO/leadership information
- Financial summaries
- Safety protocols

## 📊 Knowledge Base Architecture

### AWS Bedrock Knowledge Base (Primary)
```
Knowledge Base: BELWMDUYUJ
├── Storage: OpenSearch Serverless
├── Embeddings: Amazon Titan Embed Text v2 (1024 dimensions)
├── Data Sources:
│   ├── S3: bedrock-agent-kb-swire/swire-re/
│   │   ├── swire-re-overview.txt
│   │   ├── swire-re-capabilities.txt
│   │   ├── swire-re-formosa-wind.txt
│   │   ├── swire-re-sustainability.txt
│   │   ├── swire-re-contact.txt
│   │   └── ceo-ryan-smith.txt (CEO info)
│   └── Web Crawler: https://swire-re.com/
└── Model: Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)
```

### Azure Cognitive Search (Available)
```
Endpoint: ai-parvinddutta9607ai577068173144.search.windows.net
├── Index: swire-wind-services (37 documents)
├── Index: swire-knowledge-index
└── Integration: /api/azure-kb-chat (not currently used)
```

### Local FAISS Vector Store (FastAPI)
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
1. **Wind Energy**: Turbine maintenance, performance metrics
2. **Solar Energy**: Panel cleaning, inverter monitoring
3. **Operations**: Shift patterns, emergency procedures
4. **Safety**: PPE requirements, incident reporting
5. **Finance**: Budget categories, KPI metrics

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
├── bedrock_client.py       # AWS Bedrock client
├── rag_pipeline.py         # FAISS vector search
└── simple_agent_core.py    # Lightweight fallback
```

## 🔐 Authentication

### AWS Cognito
- **User Pool**: `us-east-1_bdqsU9GjR`
- **Client ID**: `3d51afuu9se41jk2gvmfr040dv`
- **Methods**: Email/Password, Social (Google, Facebook, Apple), Biometric

### Session Management
- JWT tokens via Amplify
- Secure token refresh
- Multi-factor authentication support

## 🌐 Deployment

### Frontend (Vercel)
- **URL**: https://sagegreen.vercel.app
- **Framework**: Next.js 14.2.33
- **Auto-deploy**: GitHub main branch
- **Build**: `npm run build`

### Backend (Local/Docker)
```bash
cd swire-agent-core
pip install -r requirements.txt
python app.py  # Runs on port 8000
```

### Docker Deployment
```bash
cd swire-agent-core
docker-compose up -d
```

## 📦 Environment Variables

### Frontend (.env.local)
```bash
# AWS Bedrock
AWS_ACCESS_KEY_ID=AKIAZ4JEEV374AIOFAV6
AWS_SECRET_ACCESS_KEY=***
AWS_REGION=us-east-1
BEDROCK_KNOWLEDGE_BASE_ID=BELWMDUYUJ
BEDROCK_AGENT_ID=XMJHPK00RO
BEDROCK_AGENT_ALIAS_ID=PDGGKSDLVP

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://ai-parvinddutta9607ai577068173144.openai.azure.com
AZURE_OPENAI_KEY=***
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://ai-parvinddutta9607ai577068173144.search.windows.net
AZURE_SEARCH_KEY=***
AZURE_SEARCH_INDEX=swire-wind-services

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_bdqsU9GjR
NEXT_PUBLIC_COGNITO_CLIENT_ID=3d51afuu9se41jk2gvmfr040dv

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Backend (.env)
```bash
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
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

## 📝 Knowledge Base Management

### Upload to S3 (Bedrock KB)
```bash
cd swire-agent-core
export AWS_ACCESS_KEY_ID=***
export AWS_SECRET_ACCESS_KEY=***

# Upload CEO data
python upload-ceo-to-s3.py

# Sync knowledge base
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id BELWMDUYUJ \
  --data-source-id AAACOA35ZY
```

### Check Ingestion Status
```bash
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id BELWMDUYUJ \
  --data-source-id AAACOA35ZY
```

## 🧪 Testing

### Test Bedrock KB
```bash
curl -X POST http://localhost:3000/api/bedrock-agent \
  -H "Content-Type: application/json" \
  -d '{"query": "Who is the CEO of Swire Renewable Energy?"}'
```

### Test FastAPI
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about wind energy services"}'
```

### Health Check
```bash
curl http://localhost:8000/health
```

## 📊 System Status

### Active Services
- ✅ AWS Bedrock Knowledge Base (BELWMDUYUJ)
- ✅ S3 Bucket (bedrock-agent-kb-swire)
- ✅ AWS Cognito Authentication
- ✅ Next.js Frontend (Vercel)
- ✅ FastAPI Backend (localhost:8000)
- ✅ Multi-Agent Orchestrator
- ⚠️ Azure Cognitive Search (configured, not primary)

### AWS Account
- **Account ID**: 679217508095
- **User**: NickD
- **Region**: us-east-1

### Azure Resources
- **Project**: swirere-3699 (eastus2)
- **OpenAI**: sageinsure-openai (eastus)
- **Search**: ai-parvinddutta9607ai577068173144

## 🔍 Troubleshooting

### Bedrock KB Returns "Unable to assist"
- Claude content filter triggered
- System automatically falls back to FastAPI
- Check S3 bucket has relevant documents

### FastAPI Not Responding
```bash
# Check if running
ps aux | grep "python app.py"

# Restart
cd swire-agent-core
python app.py
```

### Knowledge Base Empty
```bash
# List S3 contents
aws s3 ls s3://bedrock-agent-kb-swire/swire-re/ --recursive

# Upload missing data
aws s3 cp ceo-ryan-smith.txt s3://bedrock-agent-kb-swire/swire-re/

# Trigger sync
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id BELWMDUYUJ \
  --data-source-id AAACOA35ZY
```

## 📚 Documentation

- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Langchain Docs](https://python.langchain.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Push to GitHub (auto-deploys to Vercel)

## 📄 License

Proprietary - Swire Renewable Energy

---

**Last Updated**: October 18, 2025
**Version**: 2.0.0
**Status**: Production
