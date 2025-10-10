import pytesseract
from PIL import Image
import pdf2image
from langchain.tools import Tool

def extract_text_from_scan(file_path: str) -> str:
    """Extract text from scanned documents using OCR"""
    try:
        if file_path.lower().endswith('.pdf'):
            # Convert PDF to images
            pages = pdf2image.convert_from_path(file_path)
            text = ""
            for page in pages[:3]:  # Limit to first 3 pages
                text += pytesseract.image_to_string(page) + "\n"
            return text
        else:
            # Direct image processing
            image = Image.open(file_path)
            return pytesseract.image_to_string(image)
    except Exception as e:
        return f"OCR extraction failed: {str(e)}"

def get_pdf_reader_tool():
    return Tool(
        name="PDF OCR Reader",
        func=extract_text_from_scan,
        description="Extract text from scanned PDF documents or images using OCR"
    )