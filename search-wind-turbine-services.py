import requests
import json
import time

# Comprehensive wind turbine service topics for full word search
search_topics = [
    "Wind Turbine Blade Services",
    "Wind Turbine Pre-Assembly and Installation Services", 
    "Wind Turbine HV and Electrical Services",
    "Wind Turbine Marine Services",
    "Wind Turbine Service & Maintenance",
    "Wind Turbine Maintenance",
    "Wind Turbine Installation",
    "Wind Turbine Electrical Systems",
    "Wind Turbine Offshore Services",
    "Wind Turbine Blade Inspection",
    "Wind Turbine Gearbox Maintenance",
    "Wind Turbine Tower Services",
    "Wind Turbine Generator Services",
    "Wind Turbine Control Systems",
    "Wind Turbine Safety Services"
]

def search_huggingface(query, limit=50):
    """Search Hugging Face for wind turbine service topics"""
    url = "https://huggingface.co/api/quicksearch"
    params = {
        "q": query,
        "type": "dataset,model,space",
        "limit": limit
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error searching for '{query}': {response.status_code}")
            return {"models": [], "datasets": [], "spaces": []}
    except Exception as e:
        print(f"Exception searching for '{query}': {e}")
        return {"models": [], "datasets": [], "spaces": []}

# Collect all wind turbine service data
all_wind_turbine_data = {
    "wind_turbine_services_comprehensive": {
        "search_results": {},
        "service_categories": {
            "blade_services": [],
            "pre_assembly_installation": [],
            "hv_electrical_services": [],
            "marine_services": [],
            "maintenance_services": [],
            "inspection_services": [],
            "safety_services": []
        },
        "technical_specifications": [],
        "industry_standards": [],
        "equipment_and_tools": [],
        "maintenance_procedures": []
    }
}

print("Searching Hugging Face for wind turbine service topics...")

for topic in search_topics:
    print(f"\nSearching: {topic}")
    results = search_huggingface(topic)
    
    # Store search results
    all_wind_turbine_data["wind_turbine_services_comprehensive"]["search_results"][topic] = {
        "models_count": len(results.get("models", [])),
        "datasets_count": len(results.get("datasets", [])), 
        "spaces_count": len(results.get("spaces", [])),
        "total_results": len(results.get("models", [])) + len(results.get("datasets", [])) + len(results.get("spaces", []))
    }
    
    # Process models
    for model in results.get("models", [])[:10]:  # Top 10 models
        model_info = {
            "id": model.get("id", ""),
            "description": model.get("cardData", {}).get("description", ""),
            "tags": model.get("tags", []),
            "downloads": model.get("downloads", 0)
        }
        
        # Categorize based on topic
        if "blade" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["blade_services"].append(model_info)
        elif "pre-assembly" in topic.lower() or "installation" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["pre_assembly_installation"].append(model_info)
        elif "electrical" in topic.lower() or "hv" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["hv_electrical_services"].append(model_info)
        elif "marine" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["marine_services"].append(model_info)
        elif "maintenance" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["maintenance_services"].append(model_info)
        elif "inspection" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["inspection_services"].append(model_info)
        elif "safety" in topic.lower():
            all_wind_turbine_data["wind_turbine_services_comprehensive"]["service_categories"]["safety_services"].append(model_info)
    
    # Process datasets
    for dataset in results.get("datasets", [])[:10]:  # Top 10 datasets
        dataset_info = {
            "id": dataset.get("id", ""),
            "description": dataset.get("cardData", {}).get("description", ""),
            "tags": dataset.get("tags", []),
            "downloads": dataset.get("downloads", 0)
        }
        all_wind_turbine_data["wind_turbine_services_comprehensive"]["technical_specifications"].append(dataset_info)
    
    # Process spaces (applications)
    for space in results.get("spaces", [])[:5]:  # Top 5 spaces
        space_info = {
            "id": space.get("id", ""),
            "description": space.get("cardData", {}).get("description", ""),
            "tags": space.get("tags", [])
        }
        all_wind_turbine_data["wind_turbine_services_comprehensive"]["equipment_and_tools"].append(space_info)
    
    time.sleep(1)  # Rate limiting

# Add Swire's wind turbine expertise
swire_expertise = {
    "swire_wind_services": {
        "experience": "20+ years in wind energy sector",
        "global_projects": ["Baltic Eagle offshore wind farm", "Yunlin offshore wind project Taiwan"],
        "service_portfolio": [
            "Pre-Assembly and Installation Services",
            "Blade Services and Maintenance",
            "HV and Electrical Services", 
            "Service & Maintenance",
            "Marine Services",
            "Actsafe Power Ascenders"
        ],
        "technical_capabilities": [
            "Offshore wind turbine installation",
            "Blade inspection and repair",
            "Electrical system commissioning",
            "Marine logistics and support",
            "Predictive maintenance programs",
            "Safety training and certification"
        ],
        "key_contacts": {
            "operations": "operations@swire.com",
            "technical": "technical@swire.com",
            "marine": "marine@swire.com"
        }
    }
}

# Merge Swire expertise with HF data
all_wind_turbine_data.update(swire_expertise)

# Save comprehensive wind turbine services knowledge base
output_file = '/Volumes/Macintosh HD Ext./Developer/swire/wind_turbine_services_complete_kb.json'
with open(output_file, 'w') as f:
    json.dump(all_wind_turbine_data, f, indent=2)

print(f"\n✅ Wind turbine services knowledge base saved to: {output_file}")

# Print summary
total_results = sum([data["total_results"] for data in all_wind_turbine_data["wind_turbine_services_comprehensive"]["search_results"].values()])
print(f"\n📊 Search Summary:")
print(f"Topics searched: {len(search_topics)}")
print(f"Total HF results found: {total_results}")
print(f"Blade services: {len(all_wind_turbine_data['wind_turbine_services_comprehensive']['service_categories']['blade_services'])}")
print(f"Installation services: {len(all_wind_turbine_data['wind_turbine_services_comprehensive']['service_categories']['pre_assembly_installation'])}")
print(f"Electrical services: {len(all_wind_turbine_data['wind_turbine_services_comprehensive']['service_categories']['hv_electrical_services'])}")
print(f"Marine services: {len(all_wind_turbine_data['wind_turbine_services_comprehensive']['service_categories']['marine_services'])}")
print(f"Maintenance services: {len(all_wind_turbine_data['wind_turbine_services_comprehensive']['service_categories']['maintenance_services'])}")