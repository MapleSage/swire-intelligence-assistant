import importlib
import os
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langchain_community.chat_models import BedrockChat
from .bedrock_client import BedrockClient
from config import config

class AgentCore:
    def __init__(self):
        self.bedrock_client = BedrockClient()
        try:
            self.llm = BedrockChat(
                model_id=config.bedrock_model_id,
                region_name=config.aws_region
            )
        except Exception as e:
            print(f"Warning: Bedrock not available ({e}), using mock responses")
            self.llm = None
        self.tools = self._load_tools()
        self.agent = initialize_agent(
            self.tools, 
            self.llm, 
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True
        )
    
    def _load_tools(self):
        tools = []
        tools_dir = "src/tools"
        
        for filename in os.listdir(tools_dir):
            if filename.endswith('.py') and not filename.startswith('__'):
                module_name = filename[:-3]
                try:
                    module = importlib.import_module(f"src.tools.{module_name}")
                    if hasattr(module, 'get_tools'):
                        tools.extend(module.get_tools())
                except ImportError:
                    continue
        
        return tools
    
    async def run_query(self, query: str) -> str:
        try:
            if self.llm is None:
                # Mock response when Bedrock is not available
                if "financial" in query.lower() or "finance" in query.lower():
                    return "Mock Financial Summary: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"
                elif "man-hours" in query.lower() or "hours" in query.lower():
                    return "Mock HR Data: Total 45,000 hours this month. Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"
                elif "safety" in query.lower() or "ppe" in query.lower():
                    return "Mock Safety Info: PPE requirements - Hard hats, safety glasses, high-vis vests, steel-toed boots required on all sites"
                else:
                    return "Mock Response: Swire Intelligence Assistant is running. Tools available: Finance, HSE, HR Database, Knowledge Search"
            
            result = self.agent.run(query)
            return result
        except Exception as e:
            return f"Error processing query: {str(e)}"