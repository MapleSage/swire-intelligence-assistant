#!/usr/bin/env python3

import json
from datetime import datetime

# Swire Wind Energy Services Knowledge Base
swire_services = {
    "Pre-Assembly and Installation Services": {
        "description": "Complete pre-assembly and installation solutions for wind turbine projects",
        "services": [
            "Turbine component pre-assembly at staging areas",
            "Foundation preparation and installation",
            "Tower erection and nacelle installation", 
            "Rotor and blade assembly and installation",
            "Electrical connections and commissioning",
            "Grid connection and testing"
        ],
        "capabilities": [
            "Heavy lift crane operations",
            "Specialized transport and logistics",
            "Site preparation and civil works",
            "Quality assurance and safety protocols"
        ]
    },
    
    "Blade Services": {
        "description": "Comprehensive blade maintenance, repair, and optimization services",
        "services": [
            "Blade inspection using drones and rope access",
            "Leading edge erosion repair",
            "Lightning protection system maintenance",
            "Blade balancing and aerodynamic optimization",
            "Structural repairs and reinforcement",
            "Blade cleaning and surface treatments"
        ],
        "technologies": [
            "Advanced composite repair techniques",
            "Non-destructive testing methods",
            "Aerodynamic performance analysis",
            "Predictive maintenance algorithms"
        ]
    },
    
    "HV and Electrical Services": {
        "description": "High voltage electrical systems installation, maintenance, and testing",
        "services": [
            "HV cable installation and termination",
            "Transformer installation and commissioning",
            "Switchgear testing and maintenance",
            "Protection system configuration",
            "Power quality analysis and optimization",
            "Electrical safety testing and certification"
        ],
        "expertise": [
            "33kV and 66kV systems",
            "SCADA integration",
            "Grid code compliance",
            "Electrical fault analysis"
        ]
    },
    
    "Service & Maintenance": {
        "description": "Comprehensive O&M services for wind farm operations",
        "services": [
            "Scheduled preventive maintenance",
            "Condition monitoring and diagnostics",
            "Emergency repair services",
            "Performance optimization",
            "Spare parts management",
            "Technical support and training"
        ],
        "programs": [
            "Full-service O&M contracts",
            "Condition-based maintenance",
            "Remote monitoring services",
            "Warranty management"
        ]
    },
    
    "Marine Services": {
        "description": "Specialized offshore wind services and marine operations",
        "services": [
            "Offshore installation vessel operations",
            "Jack-up platform services",
            "Marine logistics and transport",
            "Subsea cable installation",
            "Offshore maintenance campaigns",
            "Weather routing and planning"
        ],
        "vessels": [
            "Self-propelled jack-up vessels",
            "Crew transfer vessels (CTVs)",
            "Service operation vessels (SOVs)",
            "Heavy lift vessels"
        ]
    },
    
    "Actsafe Power Ascenders": {
        "description": "Advanced climbing and access solutions for wind turbine maintenance",
        "equipment": [
            "Actsafe power ascenders for tower climbing",
            "Fall protection and rescue systems",
            "Portable winch systems",
            "Rope access equipment and training",
            "Emergency evacuation systems",
            "Height safety certification programs"
        ],
        "benefits": [
            "Reduced climbing time and fatigue",
            "Enhanced worker safety",
            "Emergency rescue capabilities",
            "Compliance with height safety regulations"
        ]
    }
}

def create_knowledge_documents():
    """Create structured knowledge documents for each service area"""
    
    documents = []
    
    for service_name, service_data in swire_services.items():
        doc_id = f"swire_{service_name.lower().replace(' ', '_').replace('&', 'and')}"
        
        # Build comprehensive content
        content_parts = [f"# {service_name}\n"]
        content_parts.append(f"{service_data['description']}\n")
        
        if 'services' in service_data:
            content_parts.append("## Services Offered:")
            for service in service_data['services']:
                content_parts.append(f"- {service}")
            content_parts.append("")
        
        if 'capabilities' in service_data:
            content_parts.append("## Key Capabilities:")
            for capability in service_data['capabilities']:
                content_parts.append(f"- {capability}")
            content_parts.append("")
            
        if 'technologies' in service_data:
            content_parts.append("## Technologies & Methods:")
            for tech in service_data['technologies']:
                content_parts.append(f"- {tech}")
            content_parts.append("")
            
        if 'expertise' in service_data:
            content_parts.append("## Technical Expertise:")
            for exp in service_data['expertise']:
                content_parts.append(f"- {exp}")
            content_parts.append("")
            
        if 'programs' in service_data:
            content_parts.append("## Service Programs:")
            for program in service_data['programs']:
                content_parts.append(f"- {program}")
            content_parts.append("")
            
        if 'vessels' in service_data:
            content_parts.append("## Marine Vessels:")
            for vessel in service_data['vessels']:
                content_parts.append(f"- {vessel}")
            content_parts.append("")
            
        if 'equipment' in service_data:
            content_parts.append("## Equipment & Systems:")
            for equip in service_data['equipment']:
                content_parts.append(f"- {equip}")
            content_parts.append("")
            
        if 'benefits' in service_data:
            content_parts.append("## Key Benefits:")
            for benefit in service_data['benefits']:
                content_parts.append(f"- {benefit}")
        
        content = "\n".join(content_parts)
        
        # Create document for knowledge base
        document = {
            "@search.action": "upload",
            "id": doc_id,
            "title": service_name,
            "content": content,
            "source": "Swire Services Portfolio",
            "type": "swire-service",
            "uploadedAt": datetime.now().isoformat(),
            "tags": f"swire, {service_name.lower().replace(' ', '-')}, wind-energy, services"
        }
        
        documents.append(document)
    
    return documents

def save_knowledge_base():
    """Save the complete Swire services knowledge base"""
    
    documents = create_knowledge_documents()
    
    # Save as JSON for upload
    with open('swire_services_kb.json', 'w') as f:
        json.dump({"value": documents}, f, indent=2)
    
    # Save readable format
    with open('swire_services_knowledge.md', 'w') as f:
        f.write("# Swire Wind Energy Services Knowledge Base\n\n")
        
        for doc in documents:
            f.write(f"## {doc['title']}\n\n")
            f.write(f"{doc['content']}\n\n")
            f.write("---\n\n")
    
    print(f"✅ Created {len(documents)} Swire service documents")
    print("📄 Files created:")
    print("   - swire_services_kb.json (for upload)")
    print("   - swire_services_knowledge.md (readable)")
    
    return documents

if __name__ == "__main__":
    print("🏗️ Creating Swire Wind Energy Services Knowledge Base")
    documents = save_knowledge_base()
    
    print("\n📋 Services covered:")
    for doc in documents:
        print(f"   - {doc['title']}")
    
    print("\n🚀 Ready to upload to Azure Cognitive Search!")