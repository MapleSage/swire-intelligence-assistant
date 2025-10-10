from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tempfile
import os
from src.utils.ocr import extract_text_from_pdf, extract_text_from_image

app = FastAPI(title="Swire Document Processing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process-document")
async def process_document(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        # Extract text based on file type
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf(tmp_file_path)
        elif file.content_type.startswith("image/"):
            extracted_text = extract_text_from_image(tmp_file_path)
        else:
            extracted_text = "Unsupported file type"

        # Clean up
        os.unlink(tmp_file_path)

        return {
            "success": True,
            "content": extracted_text,
            "filename": file.filename,
            "type": file.content_type
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)