#!/usr/bin/env python3

import requests
import json
from datetime import datetime

def search_huggingface(query, limit=20):
    """Search Hugging Face for specific topic"""
    url = "https://huggingface.co/api/quicksearch"
    params = {"q": query, "type": "dataset,model,space", "limit": limit}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def display_results(query, results):
    """Display search results"""
    print(f"\n🔍 Search: '{query}'")
    print(f"📊 Found {len(results)} results\n")
    
    for i, item in enumerate(results, 1):
        print(f"{i}. {item.get('id', 'Unknown')}")
        if item.get('description'):
            desc = item['description'][:100] + "..." if len(item['description']) > 100 else item['description']
            print(f"   📝 {desc}")
        if item.get('tags'):
            print(f"   🏷️  {', '.join(item['tags'][:5])}")
        print()

def create_kb_document(query, selected_results):
    """Create KB document from selected results"""
    content_parts = [f"# {query}\n"]
    
    for item in selected_results:
        content_parts.append(f"## {item.get('id', 'Unknown')}")
        if item.get('description'):
            content_parts.append(f"**Description:** {item['description']}")
        if item.get('tags'):
            content_parts.append(f"**Tags:** {', '.join(item['tags'])}")
        if item.get('downloads'):
            content_parts.append(f"**Downloads:** {item['downloads']}")
        content_parts.append("")
    
    return "\n".join(content_parts)

def upload_to_kb(query, content):
    """Upload to knowledge base"""
    doc_id = f"hf_{query.lower().replace(' ', '_').replace('&', 'and')}"
    
    document = {
        "@search.action": "upload",
        "id": doc_id,
        "title": f"{query} - Resources",
        "content": content,
        "source": "Hugging Face",
        "type": "service-resource",
        "uploadedAt": datetime.now().isoformat(),
        "tags": f"huggingface, {query.lower().replace(' ', '-')}"
    }
    
    # Save to file
    filename = f"kb_{doc_id}.json"
    with open(filename, 'w') as f:
        json.dump({"value": [document]}, f, indent=2)
    
    print(f"✅ Saved to {filename}")
    return document

if __name__ == "__main__":
    query = input("🔍 Enter search topic: ").strip()
    
    if not query:
        print("❌ No search term provided")
        exit(1)
    
    # Search HF
    results = search_huggingface(query)
    
    if not results:
        print("❌ No results found")
        exit(1)
    
    # Display results
    display_results(query, results)
    
    # Ask which to include
    print("📋 Select results to add to KB (comma-separated numbers, or 'all'):")
    selection = input("Selection: ").strip()
    
    if selection.lower() == 'all':
        selected = results
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            selected = [results[i] for i in indices if 0 <= i < len(results)]
        except:
            print("❌ Invalid selection")
            exit(1)
    
    if not selected:
        print("❌ No valid selection")
        exit(1)
    
    # Create and upload
    content = create_kb_document(query, selected)
    document = upload_to_kb(query, content)
    
    print(f"\n✅ Added {len(selected)} items to knowledge base for '{query}'")