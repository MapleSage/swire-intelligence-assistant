import json
import os
from app_simple import app
from fastapi.testclient import TestClient

def init():
    """Initialize the model"""
    global client
    client = TestClient(app)

def run(raw_data):
    """Run inference"""
    try:
        data = json.loads(raw_data)
        query = data.get("query", "")
        
        response = client.post("/chat", json={"query": query})
        return response.json()
    except Exception as e:
        return {"error": str(e)}