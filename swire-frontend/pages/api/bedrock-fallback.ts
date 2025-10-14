import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }
    
    const response = await fetch(
      `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are SageGreen, Swire\'s renewable energy AI assistant. You specialize in wind turbine services, blade maintenance, installation, electrical systems, solar energy, and sustainable energy solutions. Provide helpful, technical guidance for Swire\'s renewable energy operations.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${data.error?.message || response.statusText}`);
    }

    res.status(200).json({
      response: data.choices?.[0]?.message?.content || 'No response generated',
      source: 'azure-openai',
      model: 'gpt-4o'
    });

  } catch (error: any) {
    console.error('Azure OpenAI fallback error:', error);
    res.status(500).json({ 
      error: 'Fallback failed',
      message: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
}