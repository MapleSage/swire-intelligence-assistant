import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { CONFIG } from '../../lib/config';

const searchAzureKB = async (query: string) => {
  try {
    const searchResponse = await fetch(`${process.env.AZURE_SEARCH_ENDPOINT}/indexes/${process.env.AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_SEARCH_KEY!,
      },
      body: JSON.stringify({
        search: query,
        top: 5,
        select: 'content,title,metadata',
        searchMode: 'any',
        queryType: 'semantic',
        semanticConfiguration: 'default'
      }),
    });

    const searchResults = await searchResponse.json();
    return searchResults.value || [];
  } catch (error) {
    console.error('Azure search error:', error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    // Search Azure Knowledge Base
    const kbResults = await searchAzureKB(query);
    
    // Prepare context from KB results
    const context = kbResults.map((result: any, index: number) => 
      `[${index + 1}] ${result.title || 'Document'}: ${result.content}`
    ).join('\n\n');

    // Create enhanced prompt with KB context
    const enhancedPrompt = `You are SageGreen, Swire's renewable energy AI assistant. Use the following knowledge base information to answer the user's question about Swire's wind energy services and operations.

Knowledge Base Context:
${context}

User Question: ${query}

Instructions:
- Answer based on the knowledge base information provided
- Focus on Swire's wind energy services, safety procedures, and operations
- If the information isn't in the knowledge base, provide general renewable energy guidance
- Be concise and helpful`;

    const client = new BedrockRuntimeClient({
      region: CONFIG.AWS.REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      body: JSON.stringify({
        messages: [{ role: 'user', content: enhancedPrompt }],
        max_tokens: 1000,
        anthropic_version: 'bedrock-2023-05-31'
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    res.status(200).json({
      response: responseBody.content[0].text,
      sources: kbResults.length
    });

  } catch (error: any) {
    console.error('Azure KB chat error:', error);
    res.status(500).json({ 
      error: 'Azure KB chat failed',
      message: error.message,
      response: 'I apologize, but I encountered an error accessing the knowledge base. Please try again.'
    });
  }
}