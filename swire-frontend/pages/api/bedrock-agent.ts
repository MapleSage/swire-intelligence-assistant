import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { CONFIG } from '../../lib/config';

const getBedrockClient = () => {
  const region = CONFIG.AWS.REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured');
  }
  
  return new BedrockAgentRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
          azureContext = `\n\nAdditional context from knowledge base:\n${results.map((r: any) => `• ${r.title}: ${r.content}`).join('\n')}`;
        }
      } catch (azureError) {
        console.log('Azure search error:', azureError);
      }
    }

    // Check if query is about Swire and provide direct response
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('swire') || lowerQuery.includes('rayan') || lowerQuery.includes('swire-re')) {
      let swireResponse = '';
      
      if (lowerQuery.includes('ryan') || lowerQuery.includes('smith') || lowerQuery.includes('ceo')) {
        swireResponse = `**Ryan Smith - CEO, Swire Renewable Energy**\n\n${SWIRE_KB.leadership}\n\n**CEO Vision:** "We are entering an exciting phase of our company's journey - continuing our evolutionary path to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. As an independent company, we are now better positioned to adapt and grow with the rapidly evolving renewable energy market."\n\n**About Swire Renewable Energy:**\n${SWIRE_KB.company}`;
      } else if (lowerQuery.includes('formosa')) {
        swireResponse = `**Formosa Offshore Wind Project**\n\n${SWIRE_KB.formosa}\n\nThis is one of Taiwan's largest offshore wind developments and represents Swire RE's commitment to advancing renewable energy in the Asia-Pacific region.`;
      } else if (lowerQuery.includes('project')) {
        swireResponse = `**Swire Renewable Energy Projects**\n\n${SWIRE_KB.projects}\n\nSwire RE focuses on utility-scale renewable projects that deliver long-term value to stakeholders while contributing to global clean energy goals.`;
      } else if (lowerQuery.includes('capabilit')) {
        swireResponse = `**Swire RE Technical Capabilities**\n\n${SWIRE_KB.capabilities}\n\nThe company has expertise across the full project lifecycle from feasibility studies to long-term operations and maintenance.`;
      } else if (lowerQuery.includes('sustainab') || lowerQuery.includes('esg')) {
        swireResponse = `**Sustainability & ESG Commitments**\n\n${SWIRE_KB.sustainability}\n\nSwire RE is committed to environmental stewardship, community partnership, and transparent governance practices.`;
      } else if (lowerQuery.includes('location') || lowerQuery.includes('office')) {
        swireResponse = `**Swire RE Global Presence**\n\n${SWIRE_KB.locations}\n\nSwire RE maintains a strong presence across key renewable energy markets in Asia-Pacific and North America.`;
      } else {
        swireResponse = `**About Swire Renewable Energy**\n\n${SWIRE_KB.company}\n\n**Global Operations:** ${SWIRE_KB.locations}\n\n**Key Projects:** ${SWIRE_KB.projects}\n\nSwire RE operates with core values of environmental stewardship, community partnership, technical excellence, and financial sustainability.`;
      }
      
      return res.status(200).json({
        response: swireResponse + azureContext,
        sessionId: `session-${Date.now()}`,
        agentId,
        source: 'swire-kb'
      });
    }
    
    const client = getBedrockClient();
    
    const enhancedQuery = query + azureContext;
    
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId: CONFIG.BEDROCK.AGENT_ALIAS_ID,
      sessionId: `session-${Date.now()}`,
      inputText: enhancedQuery,
    });

    const response = await client.send(command);
    
    // Process the streaming response
    let fullResponse = '';
    if (response.completion) {
      const decoder = new TextDecoder();
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          fullResponse += decoder.decode(chunk.chunk.bytes);
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