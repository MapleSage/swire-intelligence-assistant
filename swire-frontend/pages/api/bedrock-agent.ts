import { NextApiRequest, NextApiResponse } from 'next';
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

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
const MIN_BEDROCK_INTERVAL = 2000; // 2 seconds between calls

// Azure OpenAI Fallback
const queryAzureOpenAI = async (query: string) => {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  
  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI not configured');
  }

  const systemMessage = `You are SageGreen, Swire's renewable energy AI assistant with comprehensive industry knowledge. You specialize in:
- Wind turbine services and blade maintenance
- Solar energy systems and installation
- Electrical systems and grid integration
- Sustainable energy solutions
- Project management and safety protocols

Provide helpful, technical, and accurate guidance for renewable energy operations.`;

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

  const { query, sessionId, forceAzure = false } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log('Processing query:', query);

  // If forceAzure flag is set, skip Bedrock
  if (forceAzure) {
    console.log('🔄 Force Azure mode enabled, skipping Bedrock');
    try {
      const azureResponse = await queryAzureOpenAI(query);
      return res.status(200).json({
        response: azureResponse,
        source: 'azure-openai',
        model: 'gpt-4o'
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'Azure OpenAI failed',
        details: error.message
      });
    }
  }

  // Try Bedrock Agent first
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 25000)
    );
    
    const response = await Promise.race([
      queryBedrockAgent(query, sessionId),
      timeoutPromise
    ]) as any;
    
    if (response?.text) {
      console.log('✅ Bedrock Agent response successful');
      return res.status(200).json({
        response: response.text,
        sessionId: response.sessionId,
        source: 'bedrock-agent',
        model: 'claude-3.5-sonnet-v2'
      });
    }

  } catch (bedrockError: any) {
    const statusCode = bedrockError.$metadata?.httpStatusCode;
    const isRateLimited = statusCode === 429 || bedrockError.name === 'ThrottlingException';
    
    console.error('❌ Bedrock Agent error:', {
      name: bedrockError.name,
      message: bedrockError.message,
      statusCode: statusCode,
      isRateLimited: isRateLimited
    });

    // Fallback to Azure
    console.log('⚠️ Bedrock unavailable, falling back to Azure OpenAI...');
    
    try {
      const azureResponse = await queryAzureOpenAI(query);
      
      console.log('✅ Azure OpenAI fallback successful');
      return res.status(200).json({
        response: azureResponse,
        source: 'azure-openai-fallback',
        model: 'gpt-4o',
        fallbackReason: isRateLimited ? 'rate-limit' : bedrockError.name,
        message: isRateLimited ? 'Bedrock rate limit reached. Using Azure OpenAI.' : undefined
      });
    } catch (azureError: any) {
      console.error('❌ Azure OpenAI fallback also failed:', azureError.message);
      
      return res.status(500).json({
        error: 'Both services unavailable',
        details: {
          bedrock: bedrockError.message,
          azure: azureError.message
        },
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
      });
    }
  }

  return res.status(500).json({
    error: 'No response generated'
  });
}