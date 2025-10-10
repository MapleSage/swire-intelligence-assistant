import os
from openai import AzureOpenAI
from typing import Dict, Any

class AzureAgentCore:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key="your_azure_openai_key",
            api_version="2024-02-01",
            azure_endpoint="https://ai-parvinddutta9607ai577068173144.openai.azure.com/"
        )
        
    async def process_query(self, query: str) -> Dict[str, Any]:
        try:
            # Use Azure OpenAI for processing
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are Swire Intelligence Assistant. Provide helpful responses about finance, operations, safety, and HR."},
                    {"role": "user", "content": query}
                ],
                max_tokens=500
            )
            
            return {
                "response": response.choices[0].message.content,
                "tools_used": ["azure_openai"],
                "intent": "general",
                "confidence": 0.9
            }
            
        except Exception as e:
            # Fallback to mock responses
            return self._mock_response(query)
    
    def _mock_response(self, query: str) -> Dict[str, Any]:
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["financial", "finance", "revenue", "profit"]):
            response = "Financial Summary: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"
        elif any(word in query_lower for word in ["man-hours", "hours", "hr", "employee"]):
            response = "HR Summary: Total 45,000 hours this month. Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"
        elif any(word in query_lower for word in ["safety", "ppe", "incident", "hse"]):
            response = "Safety Guidelines: PPE required - Hard hats, safety glasses, high-vis vests, steel-toed boots. 3 minor incidents this month, 0 major."
        else:
            response = "Swire Intelligence Assistant ready. Ask about finance, operations, safety, or HR data."
            
        return {
            "response": response,
            "tools_used": ["mock"],
            "intent": "general", 
            "confidence": 0.7
        }