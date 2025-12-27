# SageGreen AI Assistant - Architecture Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                            │
│              https://sagegreen.vercel.app                        │
│                                                                   │
│  Components:                                                      │
│  • ChatInterface.tsx - Main chat UI                             │
│  • No authentication required                                    │
│  • Auto-deploy from GitHub main branch                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /api/azure-kb-chat
                             │ { query: "user question" }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              API ROUTE: /api/azure-kb-chat.ts                    │
│                    (Vercel Serverless)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Try Primary   │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │    PRIMARY: Azure OpenAI + Search      │
        │                                        │
        │  Service: Azure OpenAI                │
        │  Deployment: gpt-4o                   │
        │  Model: GPT-4o (2024-11-20)          │
        │  Region: East US                      │
        │                                        │
        │  Knowledge Base:                       │
        │  • Azure Cognitive Search             │
        │  • Index: swire-wind-services         │
        │  • Index: swire-knowledge-index       │
        │                                        │
        │  Features:                             │
        │  • ESG compliance knowledge           │
        │  • Renewable energy expertise         │
        │  • Sustainability metrics             │
        │  • Company knowledge base             │
        └────────────┬───────────────────────────┘
                     │
                     │ Success?
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ YES                     ▼ NO (Error/Timeout)
┌──────────────┐         ┌────────────────────────────┐
│   Return     │         │  FALLBACK: FastAPI         │
│   Response   │         │  Multi-Agent System        │
│              │         │                            │
│  Source:     │         │  Container: swire-agent-api│
│  azure-ai    │         │  IP: 20.72.179.10         │
│              │         │  Region: East US           │
│  Model:      │         │                            │
│  gpt-4o      │         │  Features:                 │
└──────────────┘         │  • Multi-agent orchestrator│
                         │  • FAISS vector search     │
                         │  • Domain specialists      │
                         │  • Azure OpenAI fallback   │
                         └────────────┬───────────────┘
                                      │
                                      │ Success?
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼ YES                     ▼ NO
                  ┌──────────────┐         ┌──────────────────┐
                  │   Return     │         │  LAST RESORT:    │
                  │   Response   │         │  Cached Response │
                  │              │         │                  │
                  │  Source:     │         │  • ESG basics    │
                  │  fastapi-    │         │  • Renewable FAQ │
                  │  agent       │         │  • Safety info   │
                  │              │         │  • General KB    │
                  │  Model:      │         │                  │
                  │  multi-agent │         │  Source:         │
                  └──────────────┘         │  cached-fallback │
                                           └──────────────────┘
```

## Data Flow

```
User Query
    │
    ▼
┌─────────────────────────────────────────┐
│  1. Frontend (ChatInterface)            │
│     • User types ESG/renewable question │
│     • Click send                        │
│     • Show loading state                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. API Route (/api/azure-kb-chat)      │
│     • Validate request                  │
│     • Extract query                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Azure OpenAI + Cognitive Search     │
│     • Search knowledge indices          │
│     • Generate response with GPT-4o     │
│     • Apply ESG/renewable context       │
│     • Stream response                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │   Success?      │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼ YES               ▼ NO
┌──────────────┐    ┌──────────────────────┐
│  Return to   │    │  4. FastAPI Agent    │
│  Frontend    │    │     • Container API  │
│              │    │     • Multi-agent    │
│  Display     │    │     • FAISS search   │
│  response    │    │     • Domain expert  │
└──────────────┘    └──────────┬───────────┘
                               │
                               ▼
                      ┌────────┴────────┐
                      │   Success?      │
                      └────────┬────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼ YES               ▼ NO
              ┌──────────────┐    ┌──────────────┐
              │  Return to   │    │  5. Cached   │
              │  Frontend    │    │     Response │
              │              │    │              │
              │  Display     │    │  Pattern     │
              │  response    │    │  matching    │
              └──────────────┘    └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │  Return to   │
                                  │  Frontend    │
                                  │              │
                                  │  Display     │
                                  │  response    │
                                  └──────────────┘
```

## Azure Resources

```
┌─────────────────────────────────────────┐
│  Azure Subscription 1                   │
│  Two Resource Groups                    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────────┐
│  swire-rg    │    │  swire-copilot-      │
│  (East US)   │    │  dev-rg              │
│              │    │  (West Europe)       │
│  Resources:  │    │                      │
│  • Azure     │    │  Purpose:            │
│    OpenAI    │    │  Development         │
│    Service   │    │  environment         │
│              │    │                      │
│  • Cognitive │    └──────────────────────┘
│    Search    │
│    Service   │
│              │
│  • Container │
│    Instance: │
│    swire-    │
│    agent-api │
│              │
│  Endpoints:  │
│  • OpenAI:   │
│    ai-parvin │
│    ddutta... │
│    .openai   │
│    .azure    │
│              │
│  • Search:   │
│    ai-parvin │
│    ddutta... │
│    .search   │
│    .windows  │
│              │
│  • API:      │
│    20.72.    │
│    179.10    │
└──────────────┘
```

### Azure OpenAI Deployment

```
Service: ai-parvinddutta9607ai577068173144.openai.azure.com
├── Resource Group: swire-rg (East US)
├── Deployment: gpt-4o
├── Model: GPT-4o (2024-11-20)
├── Features:
│   ├── Chat completions
│   ├── Embeddings support
│   └── Streaming responses
└── Integration: Azure Cognitive Search RAG
```

### Azure Cognitive Search

```
Service: ai-parvinddutta9607ai577068173144.search.windows.net
├── Resource Group: swire-rg (East US)
├── Indices:
│   ├── swire-wind-services (37 documents)
│   │   ├── Wind energy knowledge
│   │   ├── Turbine maintenance
│   │   └── Performance metrics
│   └── swire-knowledge-index
│       ├── ESG compliance docs
│       ├── Sustainability reports
│       └── Renewable energy guides
└── Features:
    ├── Semantic search
    ├── Vector search
    └── Hybrid retrieval
```

### Azure Container Instances

```
Container: swire-agent-api
├── Resource Group: swire-rg (East US)
├── Public IP: 20.72.179.10
├── FQDN: swire-intelligence.eastus.azurecontainer.io
├── OS: Linux
├── Status: Running
├── Endpoints:
│   ├── Health: http://20.72.179.10/health
│   └── Chat: http://20.72.179.10/chat
└── Features:
    ├── Multi-agent orchestrator
    ├── FAISS vector search
    ├── Domain specialist agents
    └── Azure OpenAI integration
```

## Multi-Agent System (FastAPI)

```
┌─────────────────────────────────────────┐
│  Multi-Agent Orchestrator               │
│                                         │
│  Capabilities:                          │
│  • Query complexity analysis           │
│  • Multi-domain routing                │
│  • Agent collaboration                  │
│  • Response synthesis                   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │   Route Query     │
        └─────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│  Wind   │  │  Solar  │  │   ESG   │
│ Energy  │  │ Energy  │  │Compliance│
│ Agent   │  │ Agent   │  │  Agent  │
└─────────┘  └─────────┘  └─────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Safety  │  │ Finance │  │   RAG   │
│  Agent  │  │  Agent  │  │Pipeline │
└─────────┘  └─────────┘  └─────────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Synthesized    │
         │ Response       │
         └────────────────┘
```

## Response Format

```json
{
  "response": "AI generated response text",
  "source": "azure-ai | fastapi-agent | cached-fallback",
  "model": "gpt-4o | multi-agent | cached-responses"
}
```

## Error Handling

```
Error occurs
    │
    ▼
┌─────────────────────────────────────────┐
│  Log error to console                   │
│  console.error('Azure AI error')        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Try next fallback in chain             │
│  Azure AI → FastAPI → Cached            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Return response with source indicator  │
│  User sees answer regardless            │
└─────────────────────────────────────────┘
```

## Deployment Pipeline

```
Developer pushes to GitHub
    │
    ▼
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
│  github.com/MapleSage/swire-            │
│  intelligence-assistant                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Vercel Auto-Deploy                     │
│  • Detects push to main                 │
│  • Runs npm run build                   │
│  • Deploys to production                │
│  • Updates sagegreen.vercel.app         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Live in ~30 seconds                    │
│  https://sagegreen.vercel.app           │
└─────────────────────────────────────────┘
```

## Key Features

### ESG Compliance
- Environmental impact tracking
- Sustainability metrics and reporting
- Carbon footprint analysis
- Regulatory compliance guidance
- ESG investment recommendations

### Renewable Energy
- Wind energy project management
- Solar installation guidance
- Performance monitoring
- Maintenance scheduling
- Energy efficiency optimization

### Multi-Cloud Strategy
- **Primary**: Azure OpenAI + Cognitive Search (East US)
- **Fallback**: Azure Container Instances - FastAPI Multi-Agent
- **Last Resort**: Cached responses for common queries

### No Authentication Required
- Public access to ESG and renewable energy knowledge
- No login or registration needed
- Immediate access to AI assistant
- Focus on knowledge sharing and education

---

**Architecture Version**: 3.0.0 (Azure-only)
**Last Updated**: December 27, 2025
**Focus**: ESG & Renewable Energy
