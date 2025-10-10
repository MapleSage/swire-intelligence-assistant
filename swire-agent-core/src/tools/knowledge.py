from langchain.tools import Tool
from src.core.rag_pipeline import RAGPipeline

rag_pipeline = RAGPipeline()

def search_knowledge(query: str) -> str:
    """Search the knowledge base for relevant information"""
    return rag_pipeline.search_knowledge_base(query)

def get_tools():
    return [
        Tool(
            name="Knowledge Search",
            func=search_knowledge,
            description="Search the knowledge base for relevant documents and information"
        )
    ]