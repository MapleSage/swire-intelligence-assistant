from langchain.tools import Tool
from src.core.rag_pipeline import RAGPipeline

rag_pipeline = RAGPipeline()

def search_knowledge(query: str) -> str:
    """Search the knowledge base for relevant information"""
    return rag_pipeline.search_knowledge_base(query)

def get_ceo_info(query: str) -> str:
    """Get information about CEO Ryan Smith and company leadership"""
    ceo_info = """
    CEO: Ryan Smith
    Title: Chief Executive Officer
    Company: Swire Renewable Energy
    
    CEO Message: We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market. By combining our team's expertise and our focus on health, safety and quality, our ultimate goal is to be a strategic partner for stakeholders across the full renewable energy supply chain, driving innovation and sustainable growth for the industry.
    
    Company Focus: Renewable energy inspection, repair and maintenance
    Vision: Leading renewable energy asset manager
    Core Values: Health and safety, Quality, Innovation, Sustainable growth
    """
    return ceo_info

def get_tools():
    return [
        Tool(
            name="Knowledge Search",
            func=search_knowledge,
            description="Search the knowledge base for relevant documents and information"
        ),
        Tool(
            name="CEO Information",
            func=get_ceo_info,
            description="Get information about CEO Ryan Smith, company leadership, and executive team"
        )
    ]