# 🧠 Swire Intelligence Assistant

A private ChatGPT-like assistant for Swire Renewables using AWS Bedrock and LangChain.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Test Setup**
   ```bash
   python test_simple.py
   ```

4. **Run API**
   ```bash
   python app.py
   ```

## 📁 Project Structure

```
swire-agent-core/
├── src/
│   ├── core/           # Agent orchestration
│   │   ├── agent_core.py
│   │   └── bedrock_client.py
│   ├── tools/          # Data connectors
│   │   ├── finance.py
│   │   ├── hse.py
│   │   └── db_connector.py
│   └── utils/          # Helper utilities
│       └── ocr.py
├── data/
│   ├── docs/           # Knowledge base documents
│   └── hse/            # HSE PDF reports
├── logs/               # Application logs
├── app.py              # FastAPI main entry
└── config.yaml         # Configuration
```

## 🔧 Tools Available

- **Finance**: Revenue, expenses, profit summaries
- **HSE Reports**: PDF incident report analysis  
- **Database**: Read-only queries for HR/inventory
- **OCR**: Scanned document text extraction

## 🌐 API Endpoints

- `POST /chat` - Send queries to the agent
- `GET /health` - Health check

## 📝 Example Query

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me this month'\''s financial summary"}'
```

## 🔐 Security

- All data stays within Swire's AWS environment
- Uses AWS Bedrock for private AI processing
- Read-only database access
- No external AI model calls

## 📋 Next Steps

1. Configure AWS Bedrock credentials
2. Add real database connections
3. Upload HSE PDF reports to `data/hse/`
4. Deploy to AWS ECS/Lambda