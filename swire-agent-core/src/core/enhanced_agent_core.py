import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from .bedrock_client import BedrockClient
from ..tools.finance import get_finance_data
from ..tools.hse import get_hse_reports
from ..tools.db_connector import db_connector
from ..tools.knowledge import search_knowledge
from ..agents.multi_agent_orchestrator import MultiAgentOrchestrator

logger = logging.getLogger(__name__)

class SwireAgentCore:
    """Enhanced Agent Core with tool orchestration, reasoning, and multi-agent collaboration"""
    
    def __init__(self):
        self.bedrock_client = BedrockClient()
        self.tools = self._initialize_tools()
        self.conversation_history = []
        self.multi_agent_orchestrator = MultiAgentOrchestrator()
        
    def _initialize_tools(self) -> Dict[str, Any]:
        """Initialize available tools"""
        return {
            "finance": {
                "function": get_finance_data,
                "description": "Get financial data including revenue, expenses, and profit summaries",
                "parameters": ["query_params"]
            },
            "hse": {
                "function": get_hse_reports,
                "description": "Read and analyze HSE (Health, Safety, Environment) incident reports",
                "parameters": ["query"]
            },
            "database": {
                "function": db_connector.execute_query,
                "description": "Execute read-only SQL queries on HR, inventory, and timesheet tables",
                "parameters": ["query"]
            },
            "knowledge": {
                "function": search_knowledge,
                "description": "Search knowledge base for relevant documents and information",
                "parameters": ["query"]
            }
        }
    
    async def process_query(self, query: str, user_context: Optional[Dict] = None, use_multi_agent: bool = True) -> Dict[str, Any]:
        """Process user query with agent reasoning and multi-agent collaboration"""
        try:
            # Check if multi-agent orchestration is beneficial
            if use_multi_agent:
                orchestration_result = await self.multi_agent_orchestrator.orchestrate_query(query, user_context)
                
                # If multi-agent provided a good result, use it
                if "error" not in orchestration_result:
                    # Still execute tools for additional data
                    intent_analysis = await self._analyze_intent(query)
                    tool_results = await self._execute_tools(intent_analysis["tools"], query)
                    
                    # Combine orchestration with tool results
                    combined_response = await self._combine_orchestration_and_tools(
                        query, orchestration_result, tool_results, intent_analysis
                    )
                    
                    self._update_history(query, combined_response, tool_results)
                    
                    return {
                        "response": combined_response,
                        "tools_used": list(tool_results.keys()),
                        "agents_used": orchestration_result.get("domains_involved", []),
                        "collaboration_type": orchestration_result.get("collaboration_type", "single"),
                        "intent": intent_analysis["intent"],
                        "confidence": intent_analysis["confidence"],
                        "timestamp": datetime.now().isoformat()
                    }
            
            # Fallback to standard processing
            intent_analysis = await self._analyze_intent(query)
            tool_results = await self._execute_tools(intent_analysis["tools"], query)
            response = await self._generate_response(query, tool_results, intent_analysis)
            self._update_history(query, response, tool_results)
            
            return {
                "response": response,
                "tools_used": list(tool_results.keys()),
                "intent": intent_analysis["intent"],
                "confidence": intent_analysis["confidence"],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Agent processing error: {str(e)}")
            return {
                "response": f"I apologize, but I encountered an error processing your request: {str(e)}",
                "error": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def _analyze_intent(self, query: str) -> Dict[str, Any]:
        """Analyze user intent and determine required tools"""
        
        intent_prompt = f"""
        Analyze this user query and determine:
        1. Primary intent (financial, safety, hr, operational, general)
        2. Required tools (finance, hse, database, knowledge)
        3. Confidence level (0.0-1.0)
        
        Query: "{query}"
        
        Available tools:
        - finance: Financial data, revenue, expenses, profit analysis
        - hse: Safety reports, incident analysis, compliance data
        - database: HR data, man-hours, employee information
        - knowledge: Document search, policies, procedures
        
        Respond in JSON format:
        {{
            "intent": "primary_intent",
            "tools": ["tool1", "tool2"],
            "confidence": 0.95,
            "reasoning": "explanation"
        }}
        """
        
        try:
            bedrock_response = self.bedrock_client.call_bedrock(intent_prompt)
            # Parse JSON response
            intent_data = json.loads(bedrock_response.strip())
            return intent_data
        except Exception as e:
            logger.warning(f"Intent analysis failed, using fallback: {str(e)}")
            return self._fallback_intent_analysis(query)
    
    def _fallback_intent_analysis(self, query: str) -> Dict[str, Any]:
        """Fallback intent analysis using keyword matching"""
        query_lower = query.lower()
        
        tools = []
        intent = "general"
        confidence = 0.7
        
        # Financial keywords
        if any(word in query_lower for word in ["financial", "finance", "revenue", "profit", "expense", "cost", "budget"]):
            tools.append("finance")
            intent = "financial"
            confidence = 0.8
        
        # HR/Man-hours keywords
        if any(word in query_lower for word in ["man-hours", "hours", "employee", "staff", "workforce", "productivity"]):
            tools.append("database")
            intent = "hr"
            confidence = 0.8
        
        # Safety keywords
        if any(word in query_lower for word in ["safety", "hse", "incident", "accident", "ppe", "compliance"]):
            tools.append("hse")
            intent = "safety"
            confidence = 0.8
        
        # Knowledge/document keywords
        if any(word in query_lower for word in ["policy", "procedure", "guideline", "document", "manual"]):
            tools.append("knowledge")
            intent = "operational"
            confidence = 0.7
        
        # Dashboard/summary keywords
        if any(word in query_lower for word in ["dashboard", "summary", "overview", "report"]):
            tools.extend(["finance", "database", "hse"])
            intent = "operational"
            confidence = 0.9
        
        # Default to knowledge search if no specific tools identified
        if not tools:
            tools = ["knowledge"]
        
        return {
            "intent": intent,
            "tools": tools,
            "confidence": confidence,
            "reasoning": f"Keyword-based analysis for query: {query}"
        }
    
    async def _execute_tools(self, tool_names: List[str], query: str) -> Dict[str, Any]:
        """Execute the specified tools"""
        results = {}
        
        for tool_name in tool_names:
            if tool_name in self.tools:
                try:
                    tool_func = self.tools[tool_name]["function"]
                    
                    # Execute tool function
                    if tool_name == "database":
                        # For database, create a safe query
                        safe_query = self._create_safe_sql_query(query)
                        result = tool_func(safe_query)
                    else:
                        result = tool_func(query)
                    
                    results[tool_name] = {
                        "data": result,
                        "status": "success",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    logger.error(f"Tool {tool_name} execution failed: {str(e)}")
                    results[tool_name] = {
                        "data": f"Tool execution failed: {str(e)}",
                        "status": "error",
                        "timestamp": datetime.now().isoformat()
                    }
        
        return results
    
    def _create_safe_sql_query(self, user_query: str) -> str:
        """Create a safe SQL query based on user intent"""
        query_lower = user_query.lower()
        
        if "man-hours" in query_lower or "hours" in query_lower:
            return "SELECT site_name, SUM(hours_worked) as total_hours FROM timesheets WHERE month = CURRENT_MONTH GROUP BY site_name ORDER BY total_hours DESC LIMIT 10"
        elif "employee" in query_lower or "staff" in query_lower:
            return "SELECT department, COUNT(*) as employee_count FROM employees GROUP BY department"
        else:
            return "SELECT 'Mock HR Data' as info, '45000' as total_hours, 'Site A, Site B, Site C' as top_sites"
    
    async def _generate_response(self, query: str, tool_results: Dict[str, Any], intent_analysis: Dict[str, Any]) -> str:
        """Generate final response using Bedrock with tool results"""
        
        # Prepare context from tool results
        context_parts = []
        for tool_name, result in tool_results.items():
            if result["status"] == "success":
                context_parts.append(f"{tool_name.upper()} DATA:\n{result['data']}\n")
        
        context = "\n".join(context_parts)
        
        response_prompt = f"""
        You are the Swire Intelligence Assistant, an AI helper for Swire Renewables operations.
        
        User Query: "{query}"
        Intent: {intent_analysis["intent"]}
        
        Available Data:
        {context}
        
        Instructions:
        1. Provide a comprehensive, professional response
        2. Use the data from tools to give specific insights
        3. Format numbers clearly (e.g., $486,900 or 45,000 hours)
        4. Include actionable insights when possible
        5. Maintain focus on Swire Renewables operations
        6. If data is limited, acknowledge it but provide what you can
        
        Response:
        """
        
        try:
            response = self.bedrock_client.call_bedrock(response_prompt)
            return response.strip()
        except Exception as e:
            logger.error(f"Response generation failed: {str(e)}")
            return self._generate_fallback_response(query, tool_results)
    
    def _generate_fallback_response(self, query: str, tool_results: Dict[str, Any]) -> str:
        """Generate fallback response when Bedrock is unavailable"""
        
        if not tool_results:
            return "I'm ready to help with Swire Renewables operations. Please ask about finances, safety, HR data, or operational insights."
        
        response_parts = ["Here's what I found:\n"]
        
        for tool_name, result in tool_results.items():
            if result["status"] == "success":
                response_parts.append(f"**{tool_name.upper()}**: {result['data']}\n")
        
        return "\n".join(response_parts)
    
    def _update_history(self, query: str, response: str, tool_results: Dict[str, Any]):
        """Update conversation history"""
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response": response,
            "tools_used": list(tool_results.keys()),
            "success": True
        })
        
        # Keep only last 10 conversations
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history"""
        return self.conversation_history
    
    async def _combine_orchestration_and_tools(self, query: str, orchestration_result: Dict[str, Any], 
                                              tool_results: Dict[str, Any], intent_analysis: Dict[str, Any]) -> str:
        """Combine multi-agent orchestration with tool results"""
        
        orchestration_response = orchestration_result.get("response", "")
        
        # Add tool data if available
        tool_data_parts = []
        for tool_name, result in tool_results.items():
            if result["status"] == "success":
                tool_data_parts.append(f"**{tool_name.upper()} DATA**: {result['data']}")
        
        if tool_data_parts:
            combined = f"{orchestration_response}\n\n## Current Data\n\n" + "\n\n".join(tool_data_parts)
        else:
            combined = orchestration_response
        
        return combined
    
    def get_available_tools(self) -> Dict[str, Any]:
        """Get list of available tools"""
        return {
            name: {
                "description": tool["description"],
                "parameters": tool["parameters"]
            }
            for name, tool in self.tools.items()
        }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents and components"""
        return {
            "core_agent": {
                "status": "active",
                "tools_available": list(self.tools.keys()),
                "conversations": len(self.conversation_history)
            },
            "multi_agent_orchestrator": self.multi_agent_orchestrator.get_agent_status()
        }
    
    def get_collaboration_history(self) -> List[Dict[str, Any]]:
        """Get multi-agent collaboration history"""
        return self.multi_agent_orchestrator.get_collaboration_history()