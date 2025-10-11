import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    const response = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_KEY!,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are SageGreen, an AI assistant specializing in renewable energy, wind turbine services, and sustainable energy solutions. Provide helpful, accurate information about wind energy, solar power, and green technology.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    res.status(200).json({
      response: data.choices?.[0]?.message?.content || 'No response from Azure OpenAI',
      model: 'gpt-4o (Azure)',
      sessionId: `azure-session-${Date.now()}`
    });

  } catch (error: any) {
    console.error('Azure OpenAI error:', error);
    res.status(500).json({ 
      error: 'Azure OpenAI failed',
      message: error.message,
      response: 'I apologize, but I encountered an error connecting to Azure OpenAI. Please try again.'
    });
  }
}