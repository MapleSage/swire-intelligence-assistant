import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, agentId } = req.body;

    // Call Bedrock Agent directly
    const response = await fetch(`https://bedrock-agent-runtime.us-east-1.amazonaws.com/agents/${agentId}/sessions/test-session/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${process.env.AWS_ACCESS_KEY_ID}/20251010/us-east-1/bedrock/aws4_request`
      },
      body: JSON.stringify({
        inputText: query
      })
    });

    const data = await response.json();
    
    res.status(200).json({
      response: data.completion || 'Response from Bedrock Agent',
      agentId: agentId
    });

  } catch (error) {
    console.error('Bedrock Agent error:', error);
    res.status(500).json({ 
      response: 'Swire Intelligence Assistant is ready. Ask about finance, operations, safety, or HR.',
      error: 'Bedrock Agent temporarily unavailable'
    });
  }
}