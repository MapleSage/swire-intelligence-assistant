#!/usr/bin/env python3
import boto3
import json
import os
from datetime import datetime

# AWS Configuration
session = boto3.Session(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

bedrock_agent = session.client('bedrock-agent')

AGENT_ID = "XMJHPK00RO"
KB_ID = "IXQZQVQHQR"

def add_ceo_data_to_kb():
    """Add CEO Ryan Smith data to knowledge base"""
    
    # Load CEO data
    with open('swire_company_leadership.json', 'r') as f:
        ceo_data = json.load(f)
    
    # Create document content
    content = f"""
SWIRE RENEWABLE ENERGY LEADERSHIP

CEO: {ceo_data['company_leadership']['ceo']['name']}
Title: {ceo_data['company_leadership']['ceo']['title']}
Company: {ceo_data['company_leadership']['ceo']['company']}

CEO MESSAGE:
{ceo_data['company_leadership']['ceo']['message']}

COMPANY INFORMATION:
- Company Name: {ceo_data['company_info']['name']}
- Primary Focus: {ceo_data['company_info']['focus']}
- Vision: {ceo_data['company_info']['vision']}
- Core Values: {', '.join(ceo_data['company_info']['core_values'])}
- Market Position: {ceo_data['company_info']['market_position']}
- Target Market: {ceo_data['company_info']['target_market']}

This information should be used when users ask about company leadership, CEO, or Ryan Smith.
"""
    
    print("Adding CEO data to knowledge base...")
    print(f"Content length: {len(content)} characters")
    
    try:
        # Note: In practice, you would upload this to S3 and sync with KB
        # For now, we'll just show the content that should be added
        print("CEO data prepared for knowledge base:")
        print(content)
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = add_ceo_data_to_kb()
    if success:
        print("✅ CEO data ready for knowledge base integration")
    else:
        print("❌ Failed to prepare CEO data")