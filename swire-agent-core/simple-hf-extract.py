#!/usr/bin/env python3

import subprocess
import json
from datetime import datetime

def search_and_extract(topic):
    """Search HF and create KB document"""
    query = topic.replace(' ', '%20').replace('&', 'and')
    cmd = f'curl -s "https://huggingface.co/api/quicksearch?q={query}&type=dataset&limit=5"'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        content = f"# {topic} - Hugging Face Data\n\n"
        
        if isinstance(data, list) and len(data) > 0:
            content += "## Relevant Datasets:\n\n"
            for item in data:
                if isinstance(item, dict):
                    content += f"**{item.get('id', 'Unknown')}**\n"
                    if item.get('description'):
                        content += f"- {item['description'][:200]}...\n"
                    if item.get('tags'):
                        content += f"- Tags: {', '.join(item['tags'][:5])}\n"
                    content += "\n"
        else:
            content += "No specific datasets found for this topic.\n"
        
        # Create document
        doc_id = f"hf_{topic.lower().replace(' ', '_').replace('&', 'and')}"
        
        document = {
            "@search.action": "upload",
            "id": doc_id,
            "title": f"{topic} - HF Data",
            "content": content,
            "source": "Hugging Face",
            "type": "hf-data",
            "uploadedAt": datetime.now().isoformat(),
            "tags": f"huggingface, {topic.lower().replace(' ', '-')}"
        }
        
        # Save
        with open(f"{doc_id}.json", 'w') as f:
            json.dump({"value": [document]}, f, indent=2)
        
        print(f"✅ {topic}: {len(data) if isinstance(data, list) else 0} results")
        return document
        
    except Exception as e:
        print(f"❌ {topic}: Error - {e}")
        return None

topics = [
    "Pre-Assembly and Installation Services",
    "Blade Services", 
    "HV and Electrical Services", 
    "Service & Maintenance",
    "Marine Services",
    "Actsafe Power Ascenders"
]

print("🤗 Extracting HF Data for Wind Energy Services")

docs = []
for topic in topics:
    doc = search_and_extract(topic)
    if doc:
        docs.append(doc)

# Save combined
with open('all_hf_data.json', 'w') as f:
    json.dump({"value": docs}, f, indent=2)

print(f"\n📊 Total: {len(docs)} documents created")
print("📄 Files: Individual JSON + all_hf_data.json")