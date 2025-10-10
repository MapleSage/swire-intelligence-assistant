import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from ..tools.simple_tools import get_finance_data, get_hse_reports, db_connector, search_knowledge
from ..agents.multi_agent_orchestrator import MultiAgentOrchestrator

logger = logging.getLogger(__name__)

class SimpleSwireAgentCore:
    """Simple Agent Core without external dependencies"""
    
    def __init__(self):
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
                    intent_analysis = self._analyze_intent(query)
                    tool_results = await self._execute_tools(intent_analysis["tools"], query)
                    
                    # Combine orchestration with tool results
                    combined_response = self._combine_orchestration_and_tools(
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
            intent_analysis = self._analyze_intent(query)
            tool_results = await self._execute_tools(intent_analysis["tools"], query)
            response = self._generate_response(query, tool_results, intent_analysis)
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
    
    def _analyze_intent(self, query: str) -> Dict[str, Any]:
        """Analyze user intent and determine required tools"""
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
    
    def _generate_response(self, query: str, tool_results: Dict[str, Any], intent_analysis: Dict[str, Any]) -> str:
        """Generate final response using tool results"""
        
        if not tool_results:
            return "I'm ready to help with Swire Renewables operations. Please ask about finances, safety, HR data, or operational insights."
        
        response_parts = ["Here's what I found for your query:\n"]
        
        for tool_name, result in tool_results.items():
            if result["status"] == "success":
                response_parts.append(f"**{tool_name.upper()}**: {result['data']}\n")
        
        # Add contextual insights based on intent
        if intent_analysis["intent"] == "financial":
            response_parts.append("\n💡 **Insight**: Monitor profit margins and consider cost optimization opportunities.")
        elif intent_analysis["intent"] == "safety":
            response_parts.append("\n🛡️ **Insight**: Maintain focus on preventive measures and continuous safety training.")
        elif intent_analysis["intent"] == "hr":
            response_parts.append("\n👥 **Insight**: Track productivity trends and optimize workforce allocation.")
        
        return "\n".join(response_parts)
    
    def _combine_orchestration_and_tools(self, query: str, orchestration_result: Dict[str, Any], 
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