import { NextApiRequest, NextApiResponse } from "next";
import { azureClient } from "../../lib/azure-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, model = "gpt-4o", useRAG = true } = req.body;

    let context = "";
    
    // Use RAG if enabled
    if (useRAG) {
      try {
        const searchResults = await azureClient.searchDocuments(query, 3);
        if (searchResults.value && searchResults.value.length > 0) {
          context = searchResults.value
            .map((doc: any) => doc.content)
            .join("\n\n");
        }
      } catch (error) {
        console.error("RAG search error:", error);
      }
    }

    // Prepare messages for Azure OpenAI
    const messages = [
      {
        role: "system",
        content: `You are the Swire Intelligence Assistant, an AI helper for Swire Renewables. You provide insights on:
        
        • Financial data and analysis
        • Man-hours and workforce management  
        • Safety guidelines and HSE compliance
        • Operational efficiency and reporting
        • Document analysis and insights
        
        Always be professional, accurate, and focus on Swire's renewable energy operations.
        
        ${context ? `\n\nRelevant context from documents:\n${context}` : ""}`
      },
      {
        role: "user",
        content: query
      }
    ];

    // Call Azure OpenAI
    const response = await azureClient.chatCompletion(messages, model);
    
    const assistantMessage = response.choices[0]?.message?.content || "I apologize, but I couldn't process your request.";

    res.status(200).json({
      response: assistantMessage,
      model: model,
      usedRAG: useRAG && context.length > 0,
      contextLength: context.length
    });

  } catch (error) {
    console.error("Azure chat error:", error);
    res.status(500).json({ 
      error: "Failed to process chat request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}