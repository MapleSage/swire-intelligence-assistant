import json
import re
from datetime import datetime

def extract_swire_data():
    # Read the HTML file
    with open('swire_website.html', 'r') as f:
        html_content = f.read()
    
    # Extract text content using regex
    text_content = re.sub(r'<[^>]+>', ' ', html_content)
    text_content = re.sub(r'\s+', ' ', text_content).strip()
    
    # CEO information from the provided text
    ceo_data = {
        "name": "Ryan Smith",
        "title": "Chief Executive Officer",
        "company": "Swire Renewable Energy",
        "message": """We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager.

As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry."""
    }
    
    # Extract key information from website
    data = {
        "timestamp": datetime.now().isoformat(),
        "source": "https://swire-re.com",
        "ceo_info": ceo_data,
        "website_content": text_content[:5000],  # First 5000 chars
        "services": [
            "Renewable energy inspection",
            "Repair and maintenance",
            "Asset management",
            "Wind energy solutions",
            "Solar energy solutions"
        ],
        "focus_areas": [
            "Health and safety",
            "Quality assurance",
            "Innovation",
            "Sustainable growth"
        ]
    }
    
    # Create kb_data directory
    import os
    os.makedirs('kb_data', exist_ok=True)
    
    # Save as JSON
    with open('kb_data/swire_company_data.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Save as formatted text
    with open('kb_data/swire_company_data.txt', 'w') as f:
        f.write("SWIRE RENEWABLE ENERGY - COMPANY KNOWLEDGE BASE\n")
        f.write("=" * 50 + "\n\n")
        
        f.write("LEADERSHIP\n")
        f.write("-" * 20 + "\n")
        f.write(f"CEO: {ceo_data['name']}\n")
        f.write(f"Title: {ceo_data['title']}\n")
        f.write(f"Company: {ceo_data['company']}\n\n")
        
        f.write("CEO MESSAGE\n")
        f.write("-" * 20 + "\n")
        f.write(f"{ceo_data['message']}\n\n")
        
        f.write("SERVICES\n")
        f.write("-" * 20 + "\n")
        for service in data['services']:
            f.write(f"• {service}\n")
        f.write("\n")
        
        f.write("FOCUS AREAS\n")
        f.write("-" * 20 + "\n")
        for area in data['focus_areas']:
            f.write(f"• {area}\n")
        f.write("\n")
        
        f.write("WEBSITE CONTENT EXTRACT\n")
        f.write("-" * 20 + "\n")
        f.write(data['website_content'])
    
    return data

if __name__ == "__main__":
    data = extract_swire_data()
    print("✅ Swire RE data extracted and saved to kb_data/")
    print(f"CEO: {data['ceo_info']['name']}")
    print(f"Services: {len(data['services'])}")
    print(f"Content length: {len(data['website_content'])} chars")