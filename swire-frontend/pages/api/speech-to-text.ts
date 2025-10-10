import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { azureClient } from "../../lib/azure-client";

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
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await form.parse(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Convert file to blob for Azure Speech Services
    const fs = require("fs");
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });

    // Process with Azure Speech to Text
    const transcribedText = await azureClient.speechToText(audioBlob);

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);

    res.status(200).json({
      text: transcribedText,
      message: "Audio transcribed successfully",
    });

  } catch (error) {
    console.error("Speech to text error:", error);
    res.status(500).json({ 
      error: "Speech to text processing failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}