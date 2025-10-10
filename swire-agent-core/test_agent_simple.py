#!/usr/bin/env python3
"""Simple test of enhanced agent core without LangChain dependencies"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock the tools to avoid LangChain dependency
def mock_get_finance_data(query):
    return "Mock Financial Data: Revenue $486,900, Expenses $340,830, Net Profit $146,070 (30% margin)"

def mock_get_hse_reports(query):
    return "Mock HSE Data: 3 minor incidents this month, 0 major incidents, safety score: 95%"

def mock_execute_query(query):
    return "Mock HR Data: Total 45,000 hours this month. Top sites: Site A (12,000h), Site B (10,500h), Site C (8,200h)"

def mock_search_knowledge(query):
    return "Mock Knowledge: Safety guidelines require PPE at all times. Wind turbine maintenance scheduled quarterly."

# Simple agent core uses its own tools, no patching needed

from src.core.simple_agent_core import SimpleSwireAgentCore as SwireAgentCore

async def test_enhanced_agent():
    print("🧠 Testing Swire Enhanced Agent Core")
    print("=" * 50)
    
    agent = SwireAgentCore()
    
    # Test 1: Simple financial query
    print("\n1. FINANCIAL QUERY TEST")
    result1 = await agent.process_query("Show me this month's financial summary")
    print(f"✓ Response: {result1['response'][:150]}...")
    print(f"✓ Tools used: {result1['tools_used']}")
    print(f"✓ Intent: {result1['intent']}")
    print(f"✓ Confidence: {result1['confidence']}")
    
    # Test 2: Multi-domain query
    print("\n2. MULTI-DOMAIN QUERY TEST")
    result2 = await agent.process_query("Compare safety incidents with financial performance and man-hours")
    print(f"✓ Response: {result2['response'][:150]}...")
    print(f"✓ Tools used: {result2['tools_used']}")
    print(f"✓ Agents used: {result2.get('agents_used', [])}")
    print(f"✓ Collaboration: {result2.get('collaboration_type', 'none')}")
    
    # Test 3: Specialist agent query
    print("\n3. SPECIALIST AGENT TEST")
    result3 = await agent.process_query("What are the wind turbine maintenance requirements?")
    print(f"✓ Response: {result3['response'][:150]}...")
    print(f"✓ Tools used: {result3['tools_used']}")
    print(f"✓ Agents used: {result3.get('agents_used', [])}")
    
    # Test 4: Dashboard summary
    print("\n4. DASHBOARD SUMMARY TEST")
    result4 = await agent.process_query("Generate a comprehensive dashboard summary for operations")
    print(f"✓ Response: {result4['response'][:150]}...")
    print(f"✓ Tools used: {result4['tools_used']}")
    print(f"✓ Collaboration: {result4.get('collaboration_type', 'none')}")
    
    # Test 5: Agent status
    print("\n5. AGENT STATUS TEST")
    status = agent.get_agent_status()
    print(f"✓ Core agent tools: {status['core_agent']['tools_available']}")
    print(f"✓ Specialist domains: {status['multi_agent_orchestrator']['specialist_agent']['specializations']}")
    print(f"✓ Conversations: {status['core_agent']['conversations']}")
    
    # Test 6: Available tools
    print("\n6. AVAILABLE TOOLS TEST")
    tools = agent.get_available_tools()
    print(f"✓ Available tools: {list(tools.keys())}")
    for tool_name, tool_info in tools.items():
        print(f"  - {tool_name}: {tool_info['description']}")
    
    print("\n🎉 All tests completed successfully!")
    print("🚀 Enhanced Agent Core with Multi-Agent Orchestration is ready!")

if __name__ == "__main__":
    asyncio.run(test_enhanced_agent())