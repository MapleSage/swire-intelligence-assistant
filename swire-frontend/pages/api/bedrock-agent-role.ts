import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { CONFIG } from '../../lib/config';

const getAssumedRoleCredentials = async () => {
  const stsClient = new STSClient({
    region: CONFIG.AWS.REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: 'arn:aws:iam::679217508095:role/sweri-bedrock',
    RoleSessionName: 'bedrock-agent-session',
  });

  const response = await stsClient.send(assumeRoleCommand);
  return response.Credentials;
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

    const credentials = await getAssumedRoleCredentials();
    
    const client = new BedrockAgentRuntimeClient({
      region: CONFIG.AWS.REGION,
      credentials: {
        accessKeyId: credentials?.AccessKeyId!,
        secretAccessKey: credentials?.SecretAccessKey!,
        sessionToken: credentials?.SessionToken!,
      },
    });
    
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId: CONFIG.BEDROCK.AGENT_ALIAS_ID,
      sessionId: `session-${Date.now()}`,
      inputText: query,
    });

    const response = await client.send(command);
    
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