#!/usr/bin/env python3
import boto3
import json
import os

# AWS Configuration
session = boto3.Session(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

s3 = session.client('s3')
bedrock_agent = session.client('bedrock-agent')

BUCKET_NAME = "swire-agent-kb-bucket"
KB_ID = "IXQZQVQHQR"

def upload_ceo_data():
    """Upload CEO data to S3 knowledge base"""
    
    # CEO content for knowledge base
    content = """SWIRE RENEWABLE ENERGY LEADERSHIP

CEO: Ryan Smith
Title: Chief Executive Officer
Company: Swire Renewable Energy

CEO MESSAGE:
We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry.

COMPANY LEADERSHIP:
- CEO: Ryan Smith
- Focus: Health, Safety, Quality, Innovation
- Vision: Leading renewable energy asset manager
- Market Position: Independent company positioned for rapid growth

LEADERSHIP BACKGROUND:
Ryan Smith leads Swire Renewable Energy as Chief Executive Officer. Under his leadership, the company focuses on inspection, repair, maintenance, and asset management services across the renewable energy sector.

COMPANY HEADQUARTERS:
Swire Renewable Energy A/S
Lyshøjen 4
DK-8520 Lystrup, Denmark

This information should be used when users ask about Ryan Smith, CEO, leadership, or company executives."""

    try:
        # Upload to S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key='leadership/ceo-ryan-smith.txt',
            Body=content.encode('utf-8'),
            ContentType='text/plain'
        )
        print("✅ CEO data uploaded to S3")
        
        # Sync knowledge base
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=KB_ID,
            dataSourceId='SWIRE-DOCS'
        )
        print(f"✅ Knowledge base sync started: {response['ingestionJob']['ingestionJobId']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    upload_ceo_data()