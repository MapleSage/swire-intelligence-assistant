#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Search terms for Hugging Face
search_terms = [
    "Pre-Assembly and Installation Services",
    "Blade Services", 
    "HV and Electrical Services",
    "Service & Maintenance",
    "Marine Services",
    "Actsafe Power Ascenders"
]

def search_huggingface(query, limit=10):
    """Search Hugging Face for relevant content"""
    url = "https://huggingface.co/api/quicksearch"
    params = {"q": query, "type": "dataset,model,space", "limit": limit}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error searching HF: {e}")
        return []

def extract_content(item):
    """Extract relevant content from HF item"""
    content_parts = []
    
    if 'id' in item:
        content_parts.append(f"Repository: {item['id']}")
    
    if 'description' in item and item['description']:
        content_parts.append(f"Description: {item['description']}")
    
    if 'tags' in item and item['tags']:
        content_parts.append(f"Tags: {', '.join(item['tags'])}")
    
    if 'downloads' in item:
        content_parts.append(f"Downloads: {item['downloads']}")
    
    if 'likes' in item:
        content_parts.append(f"Likes: {item['likes']}")
    
    return "\n".join(content_parts)

def create_kb_document(search_term, hf_results):
    """Create knowledge base document from HF results"""
    
    content_parts = [f"# {search_term}\n"]
    content_parts.append("## Relevant Resources from Hugging Face:\n")
    
    for item in hf_results[:5]:  # Top 5 results
        if item.get('description') or item.get('tags'):
            content_parts.append(f"### {item.get('id', 'Unknown')}")
            content_parts.append(extract_content(item))
            content_parts.append("")
    
    if not hf_results:
        content_parts.append("No specific resources found on Hugging Face.")
        content_parts.append(f"This indicates {search_term} may be a specialized industrial service area.")
    
    return "\n".join(content_parts)

def add_to_knowledge_base():
    """Search HF and create KB documents"""
    
    all_documents = []
    
    for term in search_terms:
        print(f"🔍 Searching Hugging Face for: {term}")
        
        # Search HF
        results = search_huggingface(term)
        
        # Create KB document
        content = create_kb_document(term, results)
        
        # Create document for Azure Cognitive Search
        doc_id = f"hf_{term.lower().replace(' ', '_').replace('&', 'and')}"
        
        document = {
            "@search.action": "upload",
            "id": doc_id,
            "title": f"{term} - Industry Resources",
            "content": content,
            "source": "Hugging Face Search",
            "type": "industry-service",
            "uploadedAt": datetime.now().isoformat(),
            "tags": f"huggingface, {term.lower().replace(' ', '-')}, wind-energy, services"
        }
        
        all_documents.append(document)
        print(f"   Found {len(results)} results")
    
    # Save documents
    with open('hf_services_kb.json', 'w') as f:
        json.dump({"value": all_documents}, f, indent=2)
    
    # Save readable format
    with open('hf_services_knowledge.md', 'w') as f:
        f.write("# Hugging Face Search Results - Wind Energy Services\n\n")
        for doc in all_documents:
            f.write(f"{doc['content']}\n\n---\n\n")
    
    print(f"\n✅ Created {len(all_documents)} documents from HF search")
    print("📄 Files: hf_services_kb.json, hf_services_knowledge.md")
    
    return all_documents

if __name__ == "__main__":
    print("🤗 Searching Hugging Face for Wind Energy Services")
    documents = add_to_knowledge_base()
    
    print("\n📋 Search terms processed:")
    for term in search_terms:
        print(f"   - {term}")
    
    print("\n🚀 Ready to upload to Azure Cognitive Search!")