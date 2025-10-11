import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
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
    const { query, agentId = 'XMJHPK00RO' } = req.body;
    
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId: 'TSTALIASID',
      sessionId: `session-${Date.now()}`,
      inputText: query,
    });

    const response = await client.send(command);
    
    // Process the streaming response
    let fullResponse = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          fullResponse += text;
        }
      }
    }

    res.status(200).json({
      response: fullResponse || 'No response from agent',
      sessionId: `session-${Date.now()}`,
      agentId
    });

  } catch (error: any) {
    console.error('Bedrock agent error:', error);
    res.status(500).json({ 
      error: 'Bedrock agent failed',
      message: error.message,
      response: 'I apologize, but I encountered an error connecting to the Bedrock agent. Please try again.'
    });
  }
}