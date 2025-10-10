import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from .swire_specialist_agent import SwireSpecialistAgent

logger = logging.getLogger(__name__)

class MultiAgentOrchestrator:
    """Orchestrates multiple specialized agents for complex queries"""
    
    def __init__(self):
        self.specialist_agent = SwireSpecialistAgent()
        self.active_agents = {}
        self.collaboration_history = []
    
    async def orchestrate_query(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Orchestrate multiple agents to handle complex queries"""
        
        # Step 1: Determine if multi-agent approach is needed
        complexity_analysis = self._analyze_query_complexity(query)
        
        if complexity_analysis["requires_multiple_agents"]:
            return await self._multi_agent_processing(query, complexity_analysis)
        else:
            return await self._single_agent_processing(query, complexity_analysis)
    
    def _analyze_query_complexity(self, query: str) -> Dict[str, Any]:
        """Analyze if query requires multiple agents"""
        query_lower = query.lower()
        
        # Detect multiple domains in query
        domains_mentioned = []
        domain_keywords = {
            "finance": ["financial", "budget", "cost", "revenue", "profit", "expense"],
            "safety": ["safety", "hse", "incident", "ppe", "accident", "compliance"],
            "operations": ["operations", "shift", "schedule", "maintenance", "performance"],
            "wind_energy": ["wind", "turbine", "blade", "nacelle", "tower"],
            "solar_energy": ["solar", "panel", "inverter", "pv", "photovoltaic"]
        }
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                domains_mentioned.append(domain)
        
        # Check for comparison or correlation keywords
        comparison_keywords = ["compare", "vs", "versus", "correlation", "relationship", "impact"]
        has_comparison = any(keyword in query_lower for keyword in comparison_keywords)
        
        # Check for dashboard/summary keywords
        summary_keywords = ["dashboard", "summary", "overview", "report", "combined"]
        needs_summary = any(keyword in query_lower for keyword in summary_keywords)
        
        requires_multiple = len(domains_mentioned) > 1 or has_comparison or needs_summary
        
        return {
            "requires_multiple_agents": requires_multiple,
            "domains": domains_mentioned,
            "has_comparison": has_comparison,
            "needs_summary": needs_summary,
            "complexity_score": len(domains_mentioned) + (1 if has_comparison else 0) + (1 if needs_summary else 0)
        }
    
    async def _multi_agent_processing(self, query: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Process query using multiple specialized agents"""
        
        agent_results = {}
        
        # Execute specialist agents for each domain
        for domain in analysis["domains"]:
            try:
                result = await self.specialist_agent.provide_specialist_insight(query, domain)
                agent_results[f"specialist_{domain}"] = result
            except Exception as e:
                logger.error(f"Specialist agent {domain} failed: {str(e)}")
                agent_results[f"specialist_{domain}"] = {"error": str(e)}
        
        # Synthesize results
        synthesis = await self._synthesize_agent_results(query, agent_results, analysis)
        
        # Record collaboration
        self._record_collaboration(query, agent_results, synthesis)
        
        return {
            "response": synthesis["combined_response"],
            "agent_results": agent_results,
            "synthesis": synthesis,
            "collaboration_type": "multi_agent",
            "domains_involved": analysis["domains"],
            "timestamp": datetime.now().isoformat()
        }
    
    async def _single_agent_processing(self, query: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Process query using single specialized agent"""
        
        primary_domain = analysis["domains"][0] if analysis["domains"] else "operations"
        
        try:
            result = await self.specialist_agent.provide_specialist_insight(query, primary_domain)
            
            return {
                "response": result.get("response", "No specific response available"),
                "agent_results": {f"specialist_{primary_domain}": result},
                "collaboration_type": "single_agent",
                "primary_domain": primary_domain,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Single agent processing failed: {str(e)}")
            return {
                "response": f"Agent processing failed: {str(e)}",
                "error": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def _synthesize_agent_results(self, query: str, agent_results: Dict[str, Any], analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize results from multiple agents"""
        
        synthesis_parts = []
        key_insights = []
        recommendations = []
        
        # Process each agent result
        for agent_name, result in agent_results.items():
            if "error" not in result and "response" in result:
                domain = agent_name.replace("specialist_", "")
                synthesis_parts.append(f"**{domain.upper()}**: {result['response']}")
                
                # Extract key insights
                if "metrics" in result:
                    key_insights.extend(result["metrics"])
                if "next_action" in result:
                    recommendations.append(result["next_action"])
        
        # Create combined response
        if analysis["needs_summary"]:
            combined_response = self._create_dashboard_summary(synthesis_parts, key_insights)
        elif analysis["has_comparison"]:
            combined_response = self._create_comparison_analysis(synthesis_parts, analysis["domains"])
        else:
            combined_response = "\n\n".join(synthesis_parts)
        
        return {
            "combined_response": combined_response,
            "key_insights": key_insights,
            "recommendations": recommendations,
            "synthesis_method": "multi_domain" if len(synthesis_parts) > 1 else "single_domain"
        }
    
    def _create_dashboard_summary(self, synthesis_parts: List[str], key_insights: List[str]) -> str:
        """Create a dashboard-style summary"""
        
        summary = "# Swire Renewables Operations Dashboard\n\n"
        
        # Add synthesis parts
        for part in synthesis_parts:
            summary += f"{part}\n\n"
        
        # Add key insights section
        if key_insights:
            summary += "## Key Performance Indicators\n"
            for insight in key_insights[:5]:  # Top 5 insights
                summary += f"• {insight}\n"
            summary += "\n"
        
        # Add timestamp
        summary += f"*Dashboard generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"
        
        return summary
    
    def _create_comparison_analysis(self, synthesis_parts: List[str], domains: List[str]) -> str:
        """Create a comparison analysis"""
        
        comparison = f"# Comparative Analysis: {' vs '.join(domains).title()}\n\n"
        
        for i, part in enumerate(synthesis_parts):
            comparison += f"## Analysis {i+1}\n{part}\n\n"
        
        comparison += "## Summary\n"
        comparison += f"This analysis covers {len(domains)} operational domains, providing insights for strategic decision-making.\n"
        
        return comparison
    
    def _record_collaboration(self, query: str, agent_results: Dict[str, Any], synthesis: Dict[str, Any]):
        """Record collaboration history"""
        
        collaboration_record = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "agents_involved": list(agent_results.keys()),
            "synthesis_method": synthesis.get("synthesis_method", "unknown"),
            "success": "error" not in synthesis
        }
        
        self.collaboration_history.append(collaboration_record)
        
        # Keep only last 20 collaborations
        if len(self.collaboration_history) > 20:
            self.collaboration_history = self.collaboration_history[-20:]
    
    def get_collaboration_history(self) -> List[Dict[str, Any]]:
        """Get collaboration history"""
        return self.collaboration_history
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        return {
            "specialist_agent": {
                "status": "active",
                "specializations": self.specialist_agent.list_specializations()
            },
            "orchestrator": {
                "status": "active",
                "collaborations_completed": len(self.collaboration_history)
            }
        }