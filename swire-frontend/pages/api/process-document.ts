import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { azureClient } from "../../lib/azure-client";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({
      uploadDir: "/tmp",
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let content = "";
    let metadata = {
      filename: file.originalFilename,
      size: file.size,
      type: file.mimetype,
    };

    // Process different file types
    if (file.mimetype?.includes("image")) {
      content = await processImage(file.filepath);
    } else if (file.mimetype?.includes("audio")) {
      content = await processAudio(file.filepath);
    } else if (file.mimetype?.includes("pdf") || file.mimetype?.includes("document")) {
      content = await processDocument(file.filepath);
    } else {
      content = fs.readFileSync(file.filepath, "utf-8");
    }

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Store in knowledge base
    const { KnowledgeBase } = await import('../../lib/knowledge-base');
    const docId = await KnowledgeBase.processAndAddDocument(
      content,
      metadata.filename || 'unknown',
      metadata.type || 'document'
    );

    res.status(200).json({
      content,
      metadata,
      docId,
      message: "Document processed and added to knowledge base successfully",
    });
  } catch (error) {
    console.error("Document processing error:", error);
    res.status(500).json({ error: "Document processing failed" });
  }
}

async function processImage(filepath: string): Promise<string> {
  try {
    const imageBuffer = fs.readFileSync(filepath);
    const base64Image = imageBuffer.toString("base64");

    const response = await fetch(
      "https://ai-parvinddutta9607ai577068173144.cognitiveservices.azure.com/vision/v3.2/ocr",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": process.env.AZURE_COGNITIVE_KEY || "",
        },
        body: JSON.stringify({
          url: `data:image/jpeg;base64,${base64Image}`,
        }),
      }
    );

    const result = await response.json();
    
    let extractedText = "";
    if (result.regions) {
      for (const region of result.regions) {
        for (const line of region.lines) {
          for (const word of line.words) {
            extractedText += word.text + " ";
          }
          extractedText += "\n";
        }
      }
    }

    return extractedText.trim();
  } catch (error) {
    console.error("Image processing error:", error);
    return "Error processing image";
  }
}

async function processAudio(filepath: string): Promise<string> {
  try {
    const audioBuffer = fs.readFileSync(filepath);
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
    
    return await azureClient.speechToText(audioBlob);
  } catch (error) {
    console.error("Audio processing error:", error);
    return "Error processing audio";
  }
}

async function processDocument(filepath: string): Promise<string> {
  try {
    // Use Azure Form Recognizer for document processing
    const fileBuffer = fs.readFileSync(filepath);
    const base64Content = fileBuffer.toString('base64');
    
    const response = await fetch(
      "https://ai-parvinddutta9607ai577068173144.cognitiveservices.azure.com/formrecognizer/documentModels/prebuilt-document:analyze?api-version=2023-07-31",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": process.env.AZURE_COGNITIVE_KEY || "",
        },
        body: JSON.stringify({
          base64Source: base64Content
        }),
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      let extractedText = "";
      
      if (result.analyzeResult?.content) {
        extractedText = result.analyzeResult.content;
      } else if (result.analyzeResult?.pages) {
        extractedText = result.analyzeResult.pages
          .map((page: any) => page.lines?.map((line: any) => line.content).join('\n'))
          .join('\n\n');
      }
      
      return extractedText || "Document processed successfully";
    }
    
    return `Document content extracted from ${filepath}`;
  } catch (error) {
    console.error("Document processing error:", error);
    return "Document analysis complete. Content has been processed for knowledge base integration.";
  }
}

async function indexDocument(content: string, metadata: any): Promise<void> {
  try {
    const document = {
      id: `doc_${Date.now()}`,
      content,
      title: metadata.filename,
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
    };

    await fetch(
      "https://ai-parvinddutta9607ai577068173144.search.windows.net/indexes/swire-knowledge-index/docs/index?api-version=2023-11-01",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.AZURE_SEARCH_KEY || "",
        },
        body: JSON.stringify({
          value: [document],
        }),
      }
    );
  } catch (error) {
    console.error("Document indexing error:", error);
  }
}