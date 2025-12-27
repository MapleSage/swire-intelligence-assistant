import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    // Get Azure OpenAI credentials
    const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureOpenAIKey = process.env.AZURE_OPENAI_KEY;
    const azureOpenAIDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

    console.log('Testing Azure OpenAI Connection:');
    console.log('Endpoint:', azureOpenAIEndpoint);
    console.log('Deployment:', azureOpenAIDeployment);
    console.log('Key exists:', !!azureOpenAIKey);
    console.log('Key length:', azureOpenAIKey?.length);

    if (!azureOpenAIEndpoint || !azureOpenAIKey) {
      return res.status(500).json({
        error: 'Azure OpenAI credentials not configured',
        details: {
          hasEndpoint: !!azureOpenAIEndpoint,
          hasKey: !!azureOpenAIKey,
          endpoint: azureOpenAIEndpoint
        }
      });
    }

    const url = `${azureOpenAIEndpoint}/openai/deployments/${azureOpenAIDeployment}/chat/completions?api-version=2024-08-01-preview`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: query || 'What is ESG?' }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error response:', errorText);
      return res.status(response.status).json({
        error: 'Azure OpenAI request failed',
        status: response.status,
        details: errorText,
        url: url
      });
    }

    const responseData = await response.json();
    console.log('Success! Response:', JSON.stringify(responseData, null, 2));

    const aiResponse = responseData.choices[0]?.message?.content || 'No response generated';

    res.status(200).json({
      success: true,
      response: aiResponse,
      model: responseData.model,
      usage: responseData.usage,
      config: {
        endpoint: azureOpenAIEndpoint,
        deployment: azureOpenAIDeployment
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
