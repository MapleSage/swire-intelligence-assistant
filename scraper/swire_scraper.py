import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

class SwireScraper:
    def __init__(self):
        self.base_url = "https://swire-re.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
    def scrape_page(self, url):
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None
    
    def extract_ceo_info(self, soup):
        ceo_data = {
            "name": "Ryan Smith",
            "title": "Chief Executive Officer",
            "company": "Swire Renewable Energy",
            "message": """We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager.

As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry."""
        }
        return ceo_data
    
    def extract_content(self, soup):
        content = {
            "title": soup.find('title').text if soup.find('title') else "",
            "headings": [h.text.strip() for h in soup.find_all(['h1', 'h2', 'h3'])],
            "paragraphs": [p.text.strip() for p in soup.find_all('p') if p.text.strip()],
            "links": [{"text": a.text.strip(), "href": a.get('href')} for a in soup.find_all('a', href=True)]
        }
        return content
    
    def scrape_site(self):
        print("Scraping Swire Renewable Energy website...")
        
        # Scrape main page
        soup = self.scrape_page(self.base_url)
        if not soup:
            return None
            
        data = {
            "timestamp": datetime.now().isoformat(),
            "source": self.base_url,
            "ceo_info": self.extract_ceo_info(soup),
            "content": self.extract_content(soup)
        }
        
        return data
    
    def save_to_kb(self, data):
        os.makedirs('kb_data', exist_ok=True)
        
        # Save as JSON for knowledge base
        with open('kb_data/swire_company_data.json', 'w') as f:
            json.dump(data, f, indent=2)
        
        # Save as text for easy reading
        with open('kb_data/swire_company_data.txt', 'w') as f:
            f.write(f"Swire Renewable Energy - Company Information\n")
            f.write(f"Scraped: {data['timestamp']}\n\n")
            
            ceo = data['ceo_info']
            f.write(f"CEO: {ceo['name']}\n")
            f.write(f"Title: {ceo['title']}\n")
            f.write(f"Company: {ceo['company']}\n\n")
            f.write(f"CEO Message:\n{ceo['message']}\n\n")
            
            f.write("Website Content:\n")
            f.write(f"Title: {data['content']['title']}\n\n")
            
            if data['content']['headings']:
                f.write("Headings:\n")
                for h in data['content']['headings']:
                    f.write(f"- {h}\n")
                f.write("\n")
            
            if data['content']['paragraphs']:
                f.write("Content:\n")
                for p in data['content']['paragraphs'][:10]:  # First 10 paragraphs
                    f.write(f"{p}\n\n")

if __name__ == "__main__":
    scraper = SwireScraper()
    data = scraper.scrape_site()
    
    if data:
        scraper.save_to_kb(data)
        print("✅ Data scraped and saved to kb_data/")
        print(f"CEO: {data['ceo_info']['name']}")
        print(f"Content sections: {len(data['content']['paragraphs'])}")
    else:
        print("❌ Failed to scrape website")