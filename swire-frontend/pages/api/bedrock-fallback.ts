import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { CONFIG } from '../../lib/config';

const client = new BedrockRuntimeClient({
  region: CONFIG.AWS.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
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
    });

  } catch (error: any) {
    console.error('Bedrock error:', error);
    res.status(500).json({ 
      error: 'Bedrock failed',
      message: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
}