import json
import requests

# Extract wind turbine blade services data from HF search results
blade_services_data = {
    "wind_turbine_blade_services": {
        "maintenance_specialist_tasks": [
            "Physical inspections of blade assemblies and gearboxes atop nacelles",
            "Replace worn components using torque wrenches and hydraulic lifters", 
            "Perform vibration analysis to detect early mechanical failure",
            "Model power output fluctuations based on wind speed datasets",
            "Adjust pitch angles to maximize energy conversion",
            "Create maintenance logs with hand-sketched diagrams of rotor dynamics"
        ],
        "blade_inspection_technologies": [
            "Wind turbine monitoring accounts for 35% of openings",
            "24/7 remote diagnostics services by Nordex and Siemens Gamesa",
            "Blade erosion detection systems",
            "Surface erosion monitoring",
            "Anomaly detection in turbine blades using ML models",
            "Regular image analysis of wind turbine blades for damage detection"
        ],
        "blade_service_categories": [
            "Pre-Assembly and Installation Services",
            "Blade Services and Maintenance", 
            "HV and Electrical Services",
            "Service & Maintenance Operations",
            "Marine Services for Offshore Wind",
            "Actsafe Power Ascenders for blade access"
        ],
        "technical_specifications": [
            "Dispenser tools for viscous material application on blade surfaces",
            "Robot systems for automated blade surface work",
            "Multiple cartridge dispensers for blade maintenance",
            "Unmanned robots with articulated arms for blade access",
            "Predictive maintenance systems for wind turbines"
        ],
        "industry_applications": [
            "Renewable energy field engineering",
            "Solar panel and wind turbine component installation",
            "Torque and alignment checks using calibrated tools",
            "System integrity documentation through physical inspections",
            "Energy output metrics analysis for efficiency detection"
        ]
    }
}

# Save extracted data
with open('/Volumes/Macintosh HD Ext./Developer/swire/blade_services_knowledge.json', 'w') as f:
    json.dump(blade_services_data, f, indent=2)

print("Wind turbine blade services data extracted and saved")