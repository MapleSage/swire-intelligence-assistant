#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Wind energy and renewable content to add to knowledge base
wind_energy_docs = [
    {
        "title": "Wind Turbine Maintenance and Diagnostics",
        "content": """Wind turbine monitoring accounts for 35% of openings, with companies like Nordex and Siemens Gamesa offering 24/7 remote diagnostics services. 

The Wind Turbine Maintenance Specialist conducts physical inspections of blade assemblies and gearboxes atop nacelles, replaces worn components using torque wrenches and hydraulic lifters, and performs vibration analysis to detect early mechanical failure. They model power output fluctuations based on wind speed datasets and adjust pitch angles to maximize energy conversion. Their maintenance logs include hand-sketched diagrams of rotor dynamics to communicate novel modifications to fabrication crews.

The Renewable Energy Field Engineer installs and services solar panel arrays and wind turbine components in varied outdoor terrains, performs torque and alignment checks using calibrated tools, and documents system integrity through physical inspections. They analyze energy output metrics to detect inefficiencies, model performance under seasonal variations, and recommend system recalibrations based on empirical findings.""",
        "source": "Wind Energy Industry Analysis",
        "tags": ["wind-turbine", "maintenance", "diagnostics", "nordex", "siemens-gamesa"]
    },
    {
        "title": "Wind Farm Operations and Maintenance",
        "content": """Normally only one or two parties are engaged in operation and maintenance of the wind turbine(s), typically the owner and the operation and maintenance organisation, which in some cases is one and the same.

Wind Farm Turbine Specialists focus on comprehensive maintenance programs including:
- Physical inspections of blade assemblies and gearboxes
- Vibration analysis for early failure detection
- Power output modeling based on wind speed data
- Pitch angle adjustments for energy optimization
- Torque and alignment verification using calibrated tools
- System integrity documentation through detailed inspections

The Field Equipment Technician performs routine maintenance and repairs on heavy machinery in outdoor environments, troubleshoots mechanical failures using diagnostic tools, and ensures operational readiness through precise physical adjustments.""",
        "source": "Wind Farm Operations Manual",
        "tags": ["wind-farm", "operations", "maintenance", "turbine-specialist"]
    },
    {
        "title": "Renewable Energy Career Opportunities",
        "content": """The transition to renewable energy sources offers significant job creation opportunities in various sectors including manufacturing, installation, operation, and maintenance of renewable technologies. This diversifies local economies and creates new employment opportunities.

Key renewable energy roles include:
- Wind Turbine Maintenance Specialists
- Renewable Energy Field Engineers  
- Environmental Monitoring Specialists
- Field Equipment Technicians
- Survey Data Technicians

These positions involve working with solar panels, wind turbines, and sustainable energy solutions. The renewable energy sector reduces greenhouse gas emissions, fosters energy independence, and promotes environmental conservation while creating decent wages that drive consumer spending and stimulate local economic advancement.""",
        "source": "Renewable Energy Employment Report",
        "tags": ["renewable-energy", "careers", "job-creation", "sustainability"]
    },
    {
        "title": "Sustainable Energy Solutions and Technologies",
        "content": """Solar, wind, and sustainable energy solutions play a pivotal role in achieving sustainable development goals. Renewable energy reduces greenhouse gas emissions, fosters energy independence, and promotes environmental conservation.

Key technologies include:
- Solar panel arrays with climate-specific optimization
- Wind turbine components for varied terrains
- Energy storage and grid integration systems
- Remote monitoring and diagnostic services
- Predictive maintenance protocols

Investment in renewable energy drives economic growth by attracting public and private sector investments into green technology and infrastructure development. This boosts local economies, stimulates technological advancements, and helps create a sustainable global economy for future generations.""",
        "source": "Sustainable Energy Technology Guide",
        "tags": ["solar", "wind", "sustainable-energy", "technology", "economic-growth"]
    }
]

def add_to_knowledge_base():
    """Add wind energy documents to Azure Cognitive Search knowledge base"""
    
    search_endpoint = "https://ai-parvinddutta9607ai577068173144.search.windows.net"
    index_name = "swire-knowledge-index"
    api_key = "YOUR_AZURE_SEARCH_KEY"  # Replace with actual key
    
    documents = []
    
    for i, doc in enumerate(wind_energy_docs):
        doc_id = f"wind_energy_{i+1}_{int(datetime.now().timestamp())}"
        
        search_doc = {
            "@search.action": "upload",
            "id": doc_id,
            "title": doc["title"],
            "content": doc["content"],
            "source": doc["source"],
            "type": "wind-energy",
            "uploadedAt": datetime.now().isoformat(),
            "tags": ", ".join(doc["tags"])
        }
        
        documents.append(search_doc)
    
    # Upload to Azure Cognitive Search
    url = f"{search_endpoint}/indexes/{index_name}/docs/index?api-version=2023-11-01"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": api_key
    }
    
    payload = {"value": documents}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            print(f"✅ Successfully added {len(documents)} wind energy documents to knowledge base")
            for doc in documents:
                print(f"   - {doc['title']}")
        else:
            print(f"❌ Failed to add documents: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error adding documents: {e}")

if __name__ == "__main__":
    print("🌪️ Adding Wind Energy Content to Knowledge Base")
    add_to_knowledge_base()