import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { BlobServiceClient } from '@azure/storage-blob';

const searchSwireContainer = async (query: string) => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) return [];

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('swire');
    
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.toLowerCase().includes(query.toLowerCase()) || 
          query.toLowerCase().includes('wind') || 
          query.toLowerCase().includes('energy')) {
        blobs.push(blob.name);
      }
    }
    return blobs;
  } catch (error) {
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    // Search Swire container
    const kbResults = await searchSwireContainer(query);
    const kbContext = kbResults.length > 0 ? `\n\nSwire Knowledge Base Documents: ${kbResults.join(', ')}` : '';
    
    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID!,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
      sessionId: `session-${Date.now()}`,
      inputText: `${query}${kbContext}`,
    });

    const response = await client.send(command);
    
    let responseText = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          responseText += text;
        }
      }
    }

    res.status(200).json({
      response: responseText || 'No response from Bedrock agent',
      knowledgeBase: 'Bedrock Agent + Swire Container',
      agent: 'XMJHPK00RO'
    });

  } catch (error: any) {
    console.error('Bedrock agent error:', error);
    res.status(500).json({ 
      error: 'Bedrock agent failed',
      message: error.message,
      response: 'Bedrock agent connection failed. Using fallback.'
    });
  }
}