#!/usr/bin/env python3
import boto3

session = boto3.Session(region_name='us-east-1')
bedrock_agent = session.client('bedrock-agent')

AGENT_ID = "XMJHPK00RO"

def get_agent_info():
    """Get current agent configuration"""
    try:
        response = bedrock_agent.get_agent(agentId=AGENT_ID)
        agent = response['agent']
        
        print(f"Agent Name: {agent['agentName']}")
        print(f"Status: {agent['agentStatus']}")
        print(f"Foundation Model: {agent['foundationModel']}")
        print(f"Role ARN: {agent.get('agentResourceRoleArn', 'Not found')}")
        print("\nCurrent Instructions:")
        print(agent.get('instruction', 'No instructions found'))
        
        return agent
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def update_agent_with_ceo():
    """Update agent instructions to include CEO info"""
    
    # Get current agent config
    agent = get_agent_info()
    if not agent:
        return False
    
    # New instructions with CEO info
    instructions = f"""{agent.get('instruction', '')}

IMPORTANT COMPANY LEADERSHIP INFORMATION:
CEO: Ryan Smith
Title: Chief Executive Officer
Company: Swire Renewable Energy

CEO Message: "We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry."

When users ask about Ryan Smith, CEO, or company leadership, provide this information."""

    try:
        response = bedrock_agent.update_agent(
            agentId=AGENT_ID,
            agentName=agent['agentName'],
            instruction=instructions,
            foundationModel=agent['foundationModel'],
            agentResourceRoleArn=agent['agentResourceRoleArn']
        )
        print("✅ Agent updated with CEO information")
        
        # Prepare agent
        prepare_response = bedrock_agent.prepare_agent(agentId=AGENT_ID)
        print(f"✅ Agent prepared: {prepare_response['agentStatus']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating agent: {e}")
        return False

if __name__ == "__main__":
    print("Getting current agent info...")
    print("=" * 50)
    update_agent_with_ceo()