import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BlobServiceClient } from '@azure/storage-blob';
import { CONFIG } from '../../lib/config';

const searchSwireContainer = async (query: string) => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      console.log('No Azure storage connection, using fallback knowledge');
      return [];
    }

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
    console.error('Azure storage error:', error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    // Search Swire container for relevant documents
    const kbResults = await searchSwireContainer(query);
    const hasKnowledgeBase = kbResults.length > 0;
    const kbContext = hasKnowledgeBase ? `\n\nRelevant documents found: ${kbResults.join(', ')}` : '';
    
    // Enhanced prompt with Swire knowledge
    const enhancedPrompt = `You are SageGreen, Swire's renewable energy AI assistant specializing in wind energy services.

Swire Services Include:
• Wind Turbine Blade Services - Inspection, repair, maintenance, and replacement
• Pre-assembly & Installation - Tower assembly, nacelle installation, rotor mounting
• Electrical & HV Services - High voltage systems, grid connections, electrical maintenance
• Service & Maintenance - Preventive maintenance, troubleshooting, performance optimization
• Marine Services - Offshore wind installations, vessel operations, marine logistics
• ActSafe Power Ascenders - Specialized climbing equipment for wind turbine access${kbContext}

User Question: ${query}

Provide helpful guidance about Swire's wind energy services, safety procedures, and renewable energy operations.`;

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
      knowledgeBase: 'Swire Wind Energy Services'
    });

  } catch (error: any) {
    console.error('Swire KB error:', error);
    res.status(500).json({ 
      error: 'Swire KB failed',
      message: error.message,
      response: 'I apologize, but I encountered an error accessing Swire knowledge base. Please try again.'
    });
  }
}