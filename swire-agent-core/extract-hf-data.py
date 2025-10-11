#!/usr/bin/env python3

import subprocess
import json
from datetime import datetime

def search_hf_topic(topic):
    """Search HF and extract actual data content"""
    query = topic.replace(' ', '%20')
    cmd = f'curl -s "https://huggingface.co/api/quicksearch?q={query}&type=dataset&limit=10"'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return json.loads(result.stdout) if result.returncode == 0 else []
    except:
        return []

def get_dataset_content(dataset_id):
    """Get actual dataset content from HF"""
    cmd = f'curl -s "https://huggingface.co/api/datasets/{dataset_id}"'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return json.loads(result.stdout) if result.returncode == 0 else {}
    except:
        return {}

def extract_useful_content(dataset_info):
    """Extract useful content from dataset"""
    content = []
    
    if dataset_info.get('description'):
        content.append(f"Description: {dataset_info['description']}")
    
    if dataset_info.get('cardData'):
        card = dataset_info['cardData']
        if card.get('task_categories'):
            content.append(f"Tasks: {', '.join(card['task_categories'])}")
        if card.get('language'):
            content.append(f"Languages: {', '.join(card['language'])}")
    
    if dataset_info.get('tags'):
        content.append(f"Tags: {', '.join(dataset_info['tags'][:10])}")
    
    return '\n'.join(content)

def process_topic(topic):
    """Process single topic and extract HF data"""
    print(f"\n🔍 Processing: {topic}")
    
    # Search HF
    results = search_hf_topic(topic)
    print(f"   Found {len(results)} datasets")
    
    content_parts = [f"# {topic} - Hugging Face Data\n"]
    
    for item in results[:5]:  # Top 5 results
        dataset_id = item.get('id')
        if dataset_id:
            print(f"   📊 Extracting: {dataset_id}")
            
            # Get detailed info
            dataset_info = get_dataset_content(dataset_id)
            extracted = extract_useful_content(dataset_info)
            
            if extracted:
                content_parts.append(f"## {dataset_id}")
                content_parts.append(extracted)
                content_parts.append("")
    
    # Create KB document
    doc_id = f"hf_data_{topic.lower().replace(' ', '_').replace('&', 'and')}"
    
    document = {
        "@search.action": "upload",
        "id": doc_id,
        "title": f"{topic} - HF Data",
        "content": '\n'.join(content_parts),
        "source": "Hugging Face Datasets",
        "type": "hf-data",
        "uploadedAt": datetime.now().isoformat(),
        "tags": f"huggingface, data, {topic.lower().replace(' ', '-')}"
    }
    
    # Save file
    filename = f"{doc_id}.json"
    with open(filename, 'w') as f:
        json.dump({"value": [document]}, f, indent=2)
    
    print(f"   ✅ Saved: {filename}")
    return document

# Topics to process
topics = [
    "Pre-Assembly and Installation Services",
    "Blade Services", 
    "HV and Electrical Services",
    "Service & Maintenance",
    "Marine Services",
    "Actsafe Power Ascenders"
]

if __name__ == "__main__":
    print("🤗 Extracting Hugging Face Data for Wind Energy Topics")
    
    all_docs = []
    for topic in topics:
        doc = process_topic(topic)
        all_docs.append(doc)
    
    # Save combined
    with open('hf_extracted_data.json', 'w') as f:
        json.dump({"value": all_docs}, f, indent=2)
    
    print(f"\n✅ Processed {len(all_docs)} topics")
    print("📄 Files: Individual + hf_extracted_data.json")