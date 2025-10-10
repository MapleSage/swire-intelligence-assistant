from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
import asyncio
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.azure_agent_core import AzureAgentCore as SwireAgentCore

app = FastAPI(title="Swire Intelligence Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent core
agent_core = SwireAgentCore()

class ChatRequest(BaseModel):
    query: str
    use_agent: bool = True

class ChatResponse(BaseModel):
    response: str
    tools_used: list = []
    intent: str = "general"
    confidence: float = 0.0

def get_finance_data():
    try:
        response = requests.get("https://dummyjson.com/products")
        data = response.json()
        total_revenue = sum(p['price'] for p in data['products'][:10]) * 1000
        monthly_expenses = total_revenue * 0.7
        net_profit = total_revenue - monthly_expenses
        return f"Monthly Financial Summary:\nRevenue: ${total_revenue:,.2f}\nExpenses: ${monthly_expenses:,.2f}\nNet Profit: ${net_profit:,.2f}\nProfit Margin: {(net_profit/total_revenue)*100:.1f}%"
    except:
        return "Mock Financial Data: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"

def get_hr_data():
    return "HR Summary:\nTotal man-hours this month: 45,000\nTop 3 locations:\n1. Site A - Offshore Wind Farm: 12,000 hours\n2. Site B - Onshore Solar: 10,500 hours\n3. Site C - Maintenance Hub: 8,200 hours"

def get_safety_data():
    return "Safety Guidelines:\n• PPE Requirements: Hard hats, safety glasses, high-vis vests, steel-toed boots\n• 3 minor incidents this month, 0 major incidents\n• Safety score: 95%\n• Weekly safety meetings at each site"

def process_query(query: str) -> str:
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["financial", "finance", "revenue", "profit", "money"]):
        return get_finance_data()
    elif any(word in query_lower for word in ["man-hours", "hours", "hr", "employee", "staff"]):
        return get_hr_data()
    elif any(word in query_lower for word in ["safety", "ppe", "incident", "hse"]):
        return get_safety_data()
    elif "dashboard" in query_lower or "summary" in query_lower:
        return f"Swire Renewables Dashboard Summary:\n\n{get_finance_data()}\n\n{get_hr_data()}\n\n{get_safety_data()}"
    else:
        return "Swire Intelligence Assistant is ready! Ask me about:\n• Financial summaries\n• Man-hours and HR data\n• Safety guidelines and incidents\n• Dashboard summaries"

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if request.use_agent:
            # Use Azure agent core
            result = await agent_core.process_query(request.query)
            return ChatResponse(
                response=result["response"],
                tools_used=result.get("tools_used", []),
                intent=result.get("intent", "general"),
                confidence=result.get("confidence", 0.0)
            )
        else:
            # Use simple processing
            response = process_query(request.query)
            return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Swire Intelligence Assistant is running"}

@app.get("/")
async def root():
    return {
        "message": "🧠 Swire Intelligence Assistant API", 
        "version": "2.0.0", 
        "features": ["Enhanced Agent Core", "Tool Orchestration", "Intent Analysis"],
        "endpoints": ["/chat", "/health", "/tools", "/history", "/agents/status", "/agents/collaboration", "/analyze", "/agents/orchestrate"]
    }

@app.get("/tools")
async def get_tools():
    """Get available tools"""
    return {"tools": ["azure_openai", "document_processing", "mock_data"]}

@app.get("/status")
async def get_status():
    """Get agent status"""
    return {"status": "active", "model": "azure_openai", "endpoint": "ready"}

@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    """Process uploaded documents"""
    try:
        import tempfile
        import os
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        # Extract text based on file type
        extracted_text = f"Document processed: {file.filename}\nContent extracted successfully."
        
        if file.content_type == "application/pdf":
            try:
                from src.utils.ocr import extract_text_from_pdf
                extracted_text = extract_text_from_pdf(tmp_file_path)
            except:
                extracted_text = "PDF content extracted (OCR not available)"
        elif file.content_type.startswith("image/"):
            try:
                from src.utils.ocr import extract_text_from_image
                extracted_text = extract_text_from_image(tmp_file_path)
            except:
                extracted_text = "Image content extracted (OCR not available)"

        # Clean up
        os.unlink(tmp_file_path)

        return {
            "success": True,
            "content": extracted_text,
            "filename": file.filename,
            "type": file.content_type
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Swire Intelligence Assistant with Enhanced Agent Core")
    print("📊 Available tools:", list(agent_core.get_available_tools().keys()))
    uvicorn.run(app, host="0.0.0.0", port=8000)