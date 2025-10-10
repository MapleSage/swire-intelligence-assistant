import os
import PyPDF2
from langchain.tools import Tool

def get_hse_reports(query: str = "") -> str:
    """Read HSE reports from PDFs and extract incident summaries"""
    hse_dir = "data/hse"
    reports = []
    
    if not os.path.exists(hse_dir):
        return "No HSE reports directory found. Please add PDF reports to data/hse/"
    
    pdf_files = [f for f in os.listdir(hse_dir) if f.endswith('.pdf')]
    
    if not pdf_files:
        return "No PDF reports found in HSE directory. Mock data: 3 minor incidents this month, 0 major incidents, safety score: 95%"
    
    for pdf_file in pdf_files[:3]:  # Limit to first 3 files
        try:
            with open(os.path.join(hse_dir, pdf_file), 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages[:2]:  # First 2 pages only
                    text += page.extract_text()
                
                reports.append(f"Report {pdf_file}: {text[:200]}...")
        except Exception as e:
            reports.append(f"Error reading {pdf_file}: {str(e)}")
    
    return "\n".join(reports) if reports else "No HSE data available"

def get_tools():
    return [
        Tool(
            name="HSE Reports",
            func=get_hse_reports,
            description="Read and summarize HSE (Health, Safety, Environment) incident reports from PDF files"
        )
    ]