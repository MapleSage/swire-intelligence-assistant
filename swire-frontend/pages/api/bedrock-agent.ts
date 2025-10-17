import { NextApiRequest, NextApiResponse } from 'next';
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

export const config = {
  maxDuration: 30,
};

// Mock data for demo purposes
const getMockFinancialData = () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  return `**${currentMonth} Financial Summary**

**Revenue:**
• Formosa Phase 1: $12.4M
• Formosa Phase 2: $8.7M  
• North American Portfolio: $15.2M
• Solar Projects: $6.8M
• **Total Revenue: $43.1M**

**Operating Expenses:**
• Operations & Maintenance: $18.5M
• Personnel Costs: $12.3M
• Equipment & Materials: $4.2M
• **Total OpEx: $35.0M**

**Net Operating Income: $8.1M**
**EBITDA Margin: 18.8%**

*Note: This is demonstration data for pilot purposes.*`;
};

const getMockManHoursData = () => {
  return `**Man-Hours by Site (Current Month)**

**Offshore Wind:**
• Formosa Phase 1: 2,840 hours
• Formosa Phase 2: 1,920 hours

**Onshore Wind:**
• Texas Wind Farm A: 1,560 hours
• Oklahoma Wind Farm B: 1,240 hours
• Kansas Wind Farm C: 980 hours

**Solar Projects:**
• California Solar Array: 720 hours
• Nevada Solar Farm: 640 hours

**Maintenance & Inspection:**
• Blade Maintenance: 1,180 hours
• Electrical Systems: 860 hours
• Safety Inspections: 420 hours

**Total Man-Hours: 12,360 hours**
**Safety Record: 0 incidents this month**

*Note: This is demonstration data for pilot purposes.*`;
};

// Basic fallback responses
const getBasicResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // Financial queries
  if (lowerQuery.includes('financial') || lowerQuery.includes('finance') || lowerQuery.includes('revenue') || lowerQuery.includes('summary') || lowerQuery.includes('budget')) {
    return getMockFinancialData();
  }
  
  // HR and operational queries
  if (lowerQuery.includes('man-hours') || lowerQuery.includes('manhours') || lowerQuery.includes('hours') || lowerQuery.includes('site') || lowerQuery.includes('workforce')) {
    return getMockManHoursData();
  }
  
  // Safety queries
  if (lowerQuery.includes('safety') || lowerQuery.includes('incident') || lowerQuery.includes('hse') || lowerQuery.includes('accident')) {
    return `**Safety & HSE Dashboard**

**Current Month Performance:**
• Days without incident: 127 days
• Total safety inspections: 45
• Safety training hours: 1,240
• Near-miss reports: 3 (all resolved)

**Key Safety Metrics:**
• Lost Time Injury Rate: 0.0
• Total Recordable Incident Rate: 0.12
• Safety compliance score: 98.5%
• PPE compliance: 100%

**Recent Safety Initiatives:**
• Blade maintenance safety protocol update
• Emergency response drill (all sites)
• New fall protection equipment deployed

*Safety is our #1 priority. Zero harm is our goal.*`;
  }
  
  // Performance and KPI queries
  if (lowerQuery.includes('performance') || lowerQuery.includes('kpi') || lowerQuery.includes('metrics') || lowerQuery.includes('production')) {
    return `**Operational Performance Dashboard**

**Energy Production (Current Month):**
• Total Generation: 285.4 GWh
• Capacity Factor: 42.3%
• Availability: 96.8%

**By Technology:**
• Offshore Wind: 168.2 GWh (59%)
• Onshore Wind: 89.7 GWh (31%)
• Solar PV: 27.5 GWh (10%)

**Key Performance Indicators:**
• Turbine Availability: 97.2%
• Grid Connection Uptime: 99.1%
• Maintenance Efficiency: 94.5%
• Cost per MWh: $28.40

**Environmental Impact:**
• CO2 Avoided: 142,700 tons
• Homes Powered: ~71,350

*Note: This is demonstration data for pilot purposes.*`;
  }
  
  // Management and leadership
  if (lowerQuery.includes('management') || lowerQuery.includes('team') || lowerQuery.includes('leadership')) {
    return 'Ryan Smith serves as Chief Executive Officer of Swire Renewable Energy. Under his leadership, the company is evolving to become a leading renewable energy inspection, repair and maintenance business, and ultimately a renewable energy asset manager. The leadership team focuses on combining expertise with a commitment to health, safety and quality, positioning Swire RE as a strategic partner across the full renewable energy supply chain.';
  }
  
  if (lowerQuery.includes('ceo') || lowerQuery.includes('ryan smith') || lowerQuery.includes('ryan')) {
    return 'Ryan Smith serves as Chief Executive Officer of Swire Renewable Energy. Under his leadership, the company is evolving to become a leading renewable energy inspection, repair and maintenance business.';
  }
  
  // Projects
  if (lowerQuery.includes('project') || lowerQuery.includes('wind') || lowerQuery.includes('solar')) {
    return 'Our key projects include Formosa Offshore Wind in Taiwan (752MW total capacity), North American Wind Portfolio (1,200+ MW), and Utility-Scale Solar Development (500+ MW pipeline).';
  }
  
  if (lowerQuery.includes('formosa') || lowerQuery.includes('taiwan')) {
    return 'Formosa Offshore Wind is Swire RE\'s flagship project located in Taiwan Strait with 376 MW capacity in Phase 1 and 376 MW in Phase 2. It uses Siemens Gamesa offshore turbines and is a joint venture with Ørsted and Macquarie Capital.';
  }
  
  // Company info
  if (lowerQuery.includes('company') || lowerQuery.includes('about') || lowerQuery.includes('swire')) {
    return 'Swire Renewable Energy is a leading renewable energy developer and operator headquartered in Hong Kong. We are part of the Swire Group and focus on developing, constructing, and operating wind and solar projects across Asia-Pacific and North America.';
  }
  
  return 'Hello! I am SageGreen, your Swire Renewable Energy assistant. I can help you with questions about our wind and solar projects, operations, safety protocols, and more. For real-time data like financial summaries or operational metrics, please contact the relevant department directly.';
};

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

// Simple in-memory rate limiter
let lastBedrockCall = 0;
const MIN_BEDROCK_INTERVAL = 1000; // 1 second between calls

// Azure OpenAI Fallback
const queryAzureOpenAI = async (query: string) => {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  
  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI not configured');
  }

  const systemMessage = `You are SageGreen, Swire Renewable Energy's intelligent AI assistant with comprehensive access to company data and industry expertise.

**Company Context:**
- Swire Renewable Energy is headquartered in Hong Kong, part of Swire Group
- CEO: Ryan Smith - leading transformation to renewable energy asset management
- Key projects: Formosa Offshore Wind (Taiwan, 752MW), North American Wind Portfolio (1,200+ MW), Solar Development (500+ MW)
- Operations across Asia-Pacific and North America

**Your Capabilities:**
- Financial analysis and reporting (revenue, EBITDA, operational costs)
- Operational metrics (man-hours, production data, KPIs)
- Safety and HSE management (incident tracking, compliance)
- Project management and technical guidance
- Wind turbine maintenance and solar operations
- Real-time performance monitoring

**Current Month Sample Data (use as reference):**
- Total Revenue: $43.1M, Net Operating Income: $8.1M
- Total Man-Hours: 12,360 across all sites
- Energy Production: 285.4 GWh, Capacity Factor: 42.3%
- Safety: 127 days without incident, 98.5% compliance

Provide intelligent, data-driven responses. When asked for specific metrics, provide realistic operational data. Be professional, technical, and demonstrate deep understanding of renewable energy operations.`;

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
            content: systemMessage
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Azure OpenAI error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
};

// Query Bedrock Agent with exponential backoff
const queryBedrockAgent = async (
  query: string, 
  sessionId: string = `session-${Date.now()}`,
  retryCount: number = 0
): Promise<any> => {
  const client = getBedrockClient();
  const agentId = process.env.BEDROCK_AGENT_ID || process.env.NEXT_PUBLIC_BEDROCK_AGENT_ID;
  const agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || process.env.NEXT_PUBLIC_BEDROCK_AGENT_ALIAS_ID;
  
  if (!agentId || !agentAliasId) {
    throw new Error('BEDROCK_AGENT_ID or BEDROCK_AGENT_ALIAS_ID not configured');
  }

  // Rate limiting check
  const now = Date.now();
  const timeSinceLastCall = now - lastBedrockCall;
  if (timeSinceLastCall < MIN_BEDROCK_INTERVAL) {
    const waitTime = MIN_BEDROCK_INTERVAL - timeSinceLastCall;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before Bedrock call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastBedrockCall = Date.now();

  console.log('Invoking Bedrock Agent:', { agentId, agentAliasId, sessionId, attempt: retryCount + 1 });

  const command = new InvokeAgentCommand({
    agentId: agentId,
    agentAliasId: agentAliasId,
    sessionId: sessionId,
    inputText: query,
  });

  try {
    const response = await client.send(command);
    
    // Parse streaming response
    let fullResponse = '';
    if (response.completion) {
      const decoder = new TextDecoder();
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          fullResponse += decoder.decode(chunk.chunk.bytes);
        }
      }
    }

    return {
      text: fullResponse,
      sessionId: sessionId
    };
  } catch (error: any) {
    // Handle 429 (Too Many Requests) with exponential backoff
    if (error.$metadata?.httpStatusCode === 429 || error.name === 'ThrottlingException') {
      if (retryCount < 3) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⚠️ Rate limited (429). Retrying in ${backoffTime}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return queryBedrockAgent(query, sessionId, retryCount + 1);
      }
    }
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
    
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
        max_tokens: 2000,
        anthropic_version: 'bedrock-2023-05-31'
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return res.status(200).json({
      response: responseBody.content[0].text,
      source: 'bedrock-runtime',
      model: 'claude-3.5-sonnet-v2'
    });

  } catch (error: any) {
    console.error('Bedrock error:', error);
    
    const fallbackResponse = getBasicResponse(query);
    return res.status(200).json({
      response: fallbackResponse,
      source: 'fallback',
      model: 'cached-responses',
      error: error.message
    });
  }
}