from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Swire Intelligence Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

def process_query(query: str) -> str:
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["financial", "finance", "revenue", "profit", "money"]):
        return "Financial Summary: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"
    elif any(word in query_lower for word in ["man-hours", "hours", "hr", "employee", "staff"]):
        return "HR Data: Total 45,000 hours this month. Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"
    elif any(word in query_lower for word in ["safety", "ppe", "incident", "hse"]):
        return "Safety Info: PPE requirements - Hard hats, safety glasses, high-vis vests, steel-toed boots required on all sites"
    elif "wind" in query_lower or "turbine" in query_lower:
        return "Wind Energy Services: Swire provides comprehensive wind turbine installation, maintenance, and blade services across offshore and onshore projects"
    elif "solar" in query_lower:
        return "Solar Services: Pre-assembly, installation, and maintenance services for solar energy projects"
    else:
        return "Swire Intelligence Assistant is ready! Ask me about finance, HR, safety, wind energy, or solar services."

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
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
        "version": "1.0.0", 
        "status": "running",
        "endpoints": ["/chat", "/health"]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Swire Intelligence Assistant on port 8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)