import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { CONFIG } from '../../lib/config';

const getBedrockClient = () => {
  const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials missing');
  }
  
  return new BedrockAgentRuntimeClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    maxAttempts: 3,
  });
};

const getAzureSearchClient = () => {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const key = process.env.AZURE_SEARCH_KEY;
  
  if (!endpoint || !key) {
    return null;
  }
  
  return new SearchClient(endpoint, 'swire-index', new AzureKeyCredential(key));
};

// Swire Renewable Energy knowledge base data
const SWIRE_KB = {
  company: "Swire Renewable Energy (Swire RE) is a leading renewable energy developer and operator with headquarters in Hong Kong. The company is part of the Swire Group and focuses on developing, constructing, and operating wind and solar projects across Asia-Pacific and North America.",
  leadership: "Ryan Smith serves as Chief Executive Officer of Swire Renewable Energy. Under his leadership, the company is evolving to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As CEO, Ryan focuses on combining the team's expertise with a commitment to health, safety and quality, positioning Swire RE as a strategic partner across the full renewable energy supply chain.",
  formosa: "Formosa Offshore Wind is Swire RE's flagship project located in Taiwan Strait with 376 MW capacity in Phase 1 and 376 MW in Phase 2. It uses Siemens Gamesa offshore turbines and is a joint venture with Ørsted and Macquarie Capital.",
  projects: "Current projects include Formosa Offshore Wind (Taiwan - 752MW total), North American Wind Portfolio (1,200+ MW), Utility-Scale Solar Development (500+ MW pipeline), and Battery Energy Storage Systems across multiple markets.",
  capabilities: "Swire RE specializes in offshore wind development, onshore wind farms, utility-scale solar PV systems, energy storage integration, grid connection services, and long-term asset management.",
  sustainability: "Committed to net-zero emissions by 2030, science-based climate targets, marine biodiversity protection, community engagement programs, and sustainable supply chain practices.",
  locations: "Operations in Hong Kong, Taiwan, United States, Canada, and expanding into other Asia-Pacific markets including Japan and Australia."
};

// Simple knowledge base search function
const searchKnowledgeBase = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('ceo') || lowerQuery.includes('leadership') || lowerQuery.includes('ryan smith')) {
    return SWIRE_KB.leadership;
  }
  if (lowerQuery.includes('formosa') || lowerQuery.includes('taiwan')) {
    return SWIRE_KB.formosa;
  }
  if (lowerQuery.includes('project') || lowerQuery.includes('wind') || lowerQuery.includes('solar')) {
    return SWIRE_KB.projects;
  }
  if (lowerQuery.includes('sustainability') || lowerQuery.includes('net-zero') || lowerQuery.includes('climate')) {
    return SWIRE_KB.sustainability;
  }
  if (lowerQuery.includes('location') || lowerQuery.includes('office') || lowerQuery.includes('where')) {
    return SWIRE_KB.locations;
  }
  if (lowerQuery.includes('capability') || lowerQuery.includes('service') || lowerQuery.includes('what do')) {
    return SWIRE_KB.capabilities;
  }
  
  return SWIRE_KB.company;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, agentId = CONFIG.BEDROCK.AGENT_ID } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Search Azure Knowledge Base first
  let azureContext = '';
  const searchClient = getAzureSearchClient();
  
  if (searchClient) {
    try {
      const searchResults = await searchClient.search(query, {
        top: 3,
        select: ['content', 'title']
      });
      
      const results = [];
      for await (const result of searchResults.results) {
        results.push(result.document);
      }
      
      if (results.length > 0) {
        azureContext = results.map((r: any) => `${r.title}: ${r.content}`).join('\n');
      }
    } catch (azureError) {
      console.log('Azure search unavailable');
    }
  }

  // Try Bedrock Agent first, fallback to local knowledge base
  try {
    const client = getBedrockClient();
    const enhancedQuery = azureContext ? `${query}\n\nContext: ${azureContext}` : query;
    
    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID || CONFIG.BEDROCK.AGENT_ID,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || CONFIG.BEDROCK.AGENT_ALIAS_ID,
      sessionId: `session-${Date.now()}`,
      inputText: enhancedQuery,
    });

    // Add timeout for Vercel
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 25000)
    );
    
    const response = await Promise.race([
      client.send(command),
      timeoutPromise
    ]) as any;
    
    let fullResponse = '';
    if (response.completion) {
      const decoder = new TextDecoder();
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          fullResponse += decoder.decode(chunk.chunk.bytes);
        }
      }
    }

    if (fullResponse) {
      return res.status(200).json({
        response: fullResponse,
        sessionId: `session-${Date.now()}`,
        agentId,
        source: 'bedrock'
      });
    }
  } catch (error: any) {
    console.error('Bedrock failed:', error.message);
  }

  // Fallback to local knowledge base
  const fallbackResponse = azureContext || searchKnowledgeBase(query);
  
  res.status(200).json({
    response: fallbackResponse,
    sessionId: `session-${Date.now()}`,
    agentId,
    source: 'fallback'
  });
}