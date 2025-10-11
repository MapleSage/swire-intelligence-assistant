#!/usr/bin/env python3

import subprocess
import json
from datetime import datetime

# Wind energy service search terms
wind_services = [
    "wind turbine pre-assembly installation",
    "wind turbine blade services maintenance", 
    "wind farm HV electrical services",
    "wind turbine service maintenance",
    "offshore wind marine services",
    "wind turbine power ascenders safety"
]

def search_hf_wind_service(query):
    """Search Hugging Face for wind energy services"""
    encoded_query = query.replace(' ', '%20')
    cmd = f'curl -s "https://huggingface.co/api/quicksearch?q={encoded_query}&type=dataset&limit=15"'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            return json.loads(result.stdout)
        return []
    except:
        return []

def create_service_kb_doc(service_name, hf_results, swire_content):
    """Create comprehensive KB document"""
    
    content = f"""# {service_name}

## Swire Renewable Energy Expertise

{swire_content}

## Industry Resources and Data

"""
    
    if hf_results and isinstance(hf_results, list) and len(hf_results) > 0:
        content += "### Relevant Datasets and Models:\n\n"
        for item in hf_results[:5]:
            if isinstance(item, dict):
                content += f"**{item.get('id', 'Unknown')}**\n"
                if item.get('description'):
                    content += f"- {item['description']}\n"
                if item.get('tags'):
                    content += f"- Tags: {', '.join(item['tags'][:3])}\n"
                content += "\n"
    else:
        content += "Specialized industrial service - limited public datasets available.\n"
    
    return content

# Swire service content
swire_services_content = {
    "Pre-Assembly and Installation Services": """
**Full scope or tailored support to your project requirements**

With over 20 years' experience, our specialist teams bring expertise to support and manage the pre-assembly and installation of onshore and offshore wind turbines.

**Key Services:**
- Efficient pre-assembly at the ports
- One supplier for complete set-up
- Onshore and offshore installation
- Expert HV and electrical and mechanical installation and commissioning

**Case Studies:**
- **Baltic Eagle**: 50 x V174-9.5MW Vestas turbines (2023-2024)
- **Yunlin**: 80 x SG8.0-167Mk IV SGRE turbines (2020-2025)

**Key Contact:** Hanne Fynbo, General Manager, Pre-Assembly & Installation
""",

    "Blade Services": """
**Comprehensive blade maintenance, repair, and optimization services**

Specialized blade services ensuring optimal aerodynamic performance and structural integrity.

**Services Include:**
- Blade inspection and assessment
- Leading edge erosion repair
- Lightning protection system maintenance
- Structural repairs and reinforcement
- Performance optimization
""",

    "HV and Electrical Services": """
**High voltage electrical systems installation, maintenance, and testing**

Expert electrical services for wind farm infrastructure and grid connection.

**Capabilities:**
- HV cable installation and termination
- Transformer and switchgear commissioning
- Protection system configuration
- Grid code compliance testing
- Electrical safety certification
""",

    "Service & Maintenance": """
**Comprehensive O&M services for wind farm operations**

Full-service maintenance programs to maximize turbine availability and performance.

**Service Programs:**
- Scheduled preventive maintenance
- Condition monitoring and diagnostics
- Emergency repair services
- Performance optimization
- Spare parts management
""",

    "Marine Services": """
**Specialized offshore wind services and marine operations**

Complete marine logistics and installation support for offshore wind projects.

**Marine Capabilities:**
- Offshore installation vessel operations
- Jack-up platform services
- Marine logistics and transport
- Subsea cable installation
- Weather routing and planning
""",

    "Actsafe Power Ascenders": """
**Advanced climbing and access solutions for wind turbine maintenance**

Safety equipment and training for efficient and safe turbine access.

**Equipment & Training:**
- Actsafe power ascenders for tower climbing
- Fall protection and rescue systems
- Emergency evacuation procedures
- Height safety certification programs
"""
}

def process_all_services():
    """Process all wind energy services"""
    
    all_documents = []
    
    for i, (service_name, swire_content) in enumerate(swire_services_content.items()):
        print(f"\n🔍 Searching: {service_name}")
        
        # Search HF with wind-specific terms
        search_query = wind_services[i] if i < len(wind_services) else f"wind {service_name.lower()}"
        hf_results = search_hf_wind_service(search_query)
        
        print(f"   📊 Found {len(hf_results)} HF results")
        
        # Create KB document
        content = create_service_kb_doc(service_name, hf_results, swire_content)
        
        # Create document for upload
        doc_id = f"swire_{service_name.lower().replace(' ', '_').replace('&', 'and')}"
        
        document = {
            "@search.action": "upload",
            "id": doc_id,
            "title": f"Swire {service_name}",
            "content": content,
            "source": "Swire Renewable Energy",
            "type": "wind-service",
            "uploadedAt": datetime.now().isoformat(),
            "tags": f"swire, wind-energy, {service_name.lower().replace(' ', '-')}"
        }
        
        all_documents.append(document)
        
        # Save individual file
        with open(f"{doc_id}.json", 'w') as f:
            json.dump({"value": [document]}, f, indent=2)
        
        print(f"   ✅ Created {doc_id}.json")
    
    # Save combined file
    with open('swire_wind_services_complete.json', 'w') as f:
        json.dump({"value": all_documents}, f, indent=2)
    
    print(f"\n✅ Created {len(all_documents)} service documents")
    print("📄 Files: Individual JSON files + swire_wind_services_complete.json")
    
    return all_documents

if __name__ == "__main__":
    print("🌪️ Processing Swire Wind Energy Services with HF Data")
    documents = process_all_services()
    
    print("\n📋 Services processed:")
    for doc in documents:
        print(f"   - {doc['title']}")
    
    print("\n🚀 Ready to upload to Azure Cognitive Search!")