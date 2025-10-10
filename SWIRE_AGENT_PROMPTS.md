# 🧠 Swire Intelligence Assistant – Q/Cursor Prompt Pack

**Goal:**  
Build a private "ChatGPT for Swire Renewables" using **AWS Bedrock** + **Agent Core (LangChain/LangGraph)** for enterprise data access and analytics.

---

## 🏁 1. Project Bootstrap

**Prompt 1 – Create Project Structure**
```
Create a new Python project called "swire-agent-core" using LangChain and AWS Bedrock.
Structure:
- src/core/ → orchestration (agent logic)
- src/tools/ → connectors (Finance, HSE, HR)
- src/utils/ → helper utilities
- data/ → PDFs and mock data
- config.yaml → environment settings
Add app.py as the main entry point with a FastAPI endpoint for chat.
```

**Prompt 2 – Environment Setup**
```
Add .env and config.py to manage:
- AWS credentials and region
- BEDROCK_MODEL_ID (anthropic.claude-3-sonnet)
- VECTOR_DB (faiss or opensearch)
Ensure boto3 sessions are used for secure credential handling.
```

---

## ⚙️ 2. Bedrock Integration

**Prompt 3 – Bedrock Client**
```
Create src/core/bedrock_client.py
Use boto3 to connect to AWS Bedrock Runtime.
Add call_bedrock(prompt) to send a message and return the model response text.
Default model: anthropic.claude-3-sonnet.
```

**Prompt 4 – Agent Initialization**
```
Create AgentCore class in src/core/agent_core.py
Responsibilities:
- Load tools dynamically from src/tools/
- Initialize the Bedrock LLM
- Handle structured chat via LangChain
- Accept a natural language query and return a structured response.
```

---

## 🧩 3. Tools & Connectors

**Prompt 5 – Finance Connector**
```
In src/tools/finance.py:
Create a function get_finance_data(query_params) that calls a mock API (https://dummyjson.com or a local endpoint).
Return summarized results (e.g., monthly revenue, expenses).
Register this as a Tool for the agent.
```

**Prompt 6 – HSE Reports Reader**
```
In src/tools/hse.py:
Add a function get_hse_reports() that reads PDFs in /data/hse/ and extracts key incident summaries.
Use PyPDF2 or pdfplumber for text extraction.
```

**Prompt 7 – PDF Reader (OCR)**
```
In src/utils/ocr.py:
Add extract_text_from_scan(file_path) using pytesseract.
Integrate this as a tool PDFReader for scanned docs.
```

**Prompt 8 – Database Connector**
```
Create a base connector in src/tools/db_connector.py using SQLAlchemy.
It should allow read-only queries to a PostgreSQL database for HR, inventory, or timesheets tables.
```

---

## 🔍 4. Knowledge Retrieval (RAG)

**Prompt 9 – Vector Indexing**
```
Add a RAG pipeline in src/core/rag_pipeline.py:
- Load documents from /data/docs/
- Create embeddings using LangChain embeddings (Bedrock or OpenAI-compatible)
- Store vectors in FAISS
- Implement search_knowledge_base(query) to return top snippets.
```

**Prompt 10 – Knowledge Tool**
```
Expose search_knowledge_base as a Tool in the agent.
The tool should retrieve the most relevant data and return a concise snippet summary.
```

---

## 🧠 5. Example Queries & Tests

**Prompt 11 – Query: Man Hours**
```
Ask the agent:
"Show me this month's total man-hours by site and highlight the top 3 locations."
Expected: Fetch HR API data, summarize, and return a short insight.
```

**Prompt 12 – Cross-Domain Query**
```
Ask:
"Compare incident frequency in HSE reports with total man-hours logged this quarter."
Agent should combine data from HSE and HR sources.
```

**Prompt 13 – Document Summary**
```
Upload a PDF in /data/docs/ and ask:
"Summarize the key findings from the last maintenance inspection."
```

---

## 🚀 6. API & Deployment

**Prompt 14 – FastAPI Endpoint**
```
In app.py, add POST /chat endpoint.
Accept JSON: {"query": "..."}
Pass it to AgentCore.run_query() and return the response as JSON.
Enable CORS for local dev.
```

**Prompt 15 – Docker Setup**
```
Create a Dockerfile:
- Base: python:3.11-slim
- Install project dependencies
- Copy project files
- Expose port 8000
- Run app.py with uvicorn
Add docker-compose.yml for FAISS + API service.
```

---

## 💬 7. Integrations

**Prompt 16 – Teams Bot**
```
Create src/integrations/teams.py with a webhook listener.
When a message arrives from Teams, send the query to /chat endpoint.
Format response using Markdown or adaptive cards.
```

**Prompt 17 – Power BI Plugin**
```
Add an endpoint /insights that returns summarized data (JSON).
Power BI can call this endpoint for dynamic visualizations driven by natural language queries.
```

---

## 🧩 8. Optional Enhancements

**Prompt 18 – Memory & Context**
```
Add short-term memory to AgentCore using ConversationBufferMemory from LangChain.
Store recent queries per user session.
```

**Prompt 19 – Role-based Access**
```
Add a simple user_roles.json that defines which tools each role can access (e.g., Finance can't read HR data).
Filter tool access in AgentCore initialization.
```

**Prompt 20 – Logging & Audit**
```
Add a middleware to log all queries and responses with timestamps and user IDs to /logs/query_history.json.
```

---

## ✅ 9. Final Check

**Prompt 21 – E2E Test**
```
Run an end-to-end test:
Ask: "Generate a dashboard summary for this week's operations combining HSE, HR, and Finance insights."
Expected: multi-tool orchestration + summary generation from mock data.
```

---

## 📦 10. Ready to Deploy

**Prompt 22 – AWS Deployment**
```
Deploy FastAPI app to AWS ECS (Fargate) or Lambda via API Gateway.
Ensure Bedrock, FAISS, and database are accessible within the same VPC.
Use IAM roles for Bedrock access.
```

---

### 🔐 Security Reminder
Always keep data inside Swire's AWS environment.  
If any external AI model is used, ensure it's **Bedrock-hosted** (no data leaves the private network).