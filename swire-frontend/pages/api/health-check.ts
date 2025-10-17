import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results = {
    timestamp: new Date().toISOString(),
    bedrock: { status: 'unknown', error: null as any },
    azure: { status: 'unknown', error: null as any },
    environment: {
      hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      hasAzureConfig: !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY),
      agentId: process.env.BEDROCK_AGENT_ID,
      aliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
      region: process.env.AWS_REGION
    }
  };

  // Test Bedrock
  try {
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
      sessionId: `health-check-${Date.now()}`,
      inputText: 'Hello',
    });

    const response = await Promise.race([
      client.send(command),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);

    results.bedrock.status = 'healthy';
  } catch (error: any) {
    results.bedrock.status = 'error';
    results.bedrock.error = {
      name: error.name,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode
    };
  }

  // Test Azure OpenAI
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    
    if (endpoint && apiKey) {
      const response = await fetch(
        `${endpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          }),
        }
      );

      if (response.ok) {
        results.azure.status = 'healthy';
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      results.azure.status = 'not_configured';
    }
  } catch (error: any) {
    results.azure.status = 'error';
    results.azure.error = error.message;
  }

  return res.status(200).json(results);
}