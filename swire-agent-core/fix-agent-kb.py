#!/usr/bin/env python3
import boto3
import json

session = boto3.Session(region_name='us-east-1')
bedrock_agent = session.client('bedrock-agent')

AGENT_ID = "XMJHPK00RO"

def update_agent_instructions():
    """Update agent instructions to include CEO information"""
    
    instructions = """You are SageGreen, an AI assistant for Swire Renewable Energy. You have access to comprehensive knowledge about renewable energy operations, safety protocols, and company information.

COMPANY LEADERSHIP:
- CEO: Ryan Smith
- Title: Chief Executive Officer  
- Company: Swire Renewable Energy
- Message: "We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry."

COMPANY INFORMATION:
- Focus: Renewable energy inspection, repair and maintenance
- Vision: Leading renewable energy asset manager
- Core Values: Health and safety, Quality, Innovation, Sustainable growth
- Headquarters: Lyshøjen 4, DK-8520 Lystrup, Denmark

When users ask about Ryan Smith, CEO, leadership, or company executives, provide this information. Always be helpful and professional while focusing on renewable energy expertise."""

    try:
        response = bedrock_agent.update_agent(
            agentId=AGENT_ID,
            agentName="SageGreen Renewable Energy Assistant",
            instruction=instructions,
            foundationModel="anthropic.claude-3-sonnet-20240229-v1:0"
        )
        print("✅ Agent instructions updated with CEO information")
        
        # Prepare agent
        prepare_response = bedrock_agent.prepare_agent(agentId=AGENT_ID)
        print(f"✅ Agent prepared: {prepare_response['agentStatus']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    update_agent_instructions()