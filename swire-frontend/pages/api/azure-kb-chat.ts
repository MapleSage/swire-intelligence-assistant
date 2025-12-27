import { NextApiRequest, NextApiResponse } from 'next';

const searchAzureKB = async (query: string) => {
  try {
    const searchResponse = await fetch(`${process.env.AZURE_SEARCH_ENDPOINT}/indexes/${process.env.AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_SEARCH_KEY!,
      },
      body: JSON.stringify({
        search: query,
        top: 5,
        select: 'content,title,metadata',
        searchMode: 'any',
        queryType: 'simple'
      }),
    });

    if (!searchResponse.ok) {
      console.error('Azure Search failed:', await searchResponse.text());
      return [];
    }

    const searchResults = await searchResponse.json();
    return searchResults.value || [];
  } catch (error) {
    console.error('Azure search error:', error);
    return [];
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search Azure Knowledge Base
    const kbResults = await searchAzureKB(query);

    // Prepare context from KB results
    const context = kbResults.length > 0
      ? kbResults.map((result: any, index: number) =>
          `[${index + 1}] ${result.title || 'Document'}: ${result.content}`
        ).join('\n\n')
      : 'No specific knowledge base results found.';

    // Create enhanced prompt with KB context
    const systemPrompt = `You are SageGreen AI Assistant, an expert in ESG (Environmental, Social, and Governance) compliance, renewable energy, sustainability metrics, and environmental insights.

Knowledge Base Context:
${context}

Your role is to:
- Provide accurate information about ESG compliance and sustainability
- Offer guidance on renewable energy solutions (wind, solar, etc.)
- Help with sustainability metrics and carbon footprint analysis
- Answer questions about environmental regulations and best practices
- Be helpful, concise, and professional`;

    const userMessage = query;

    // Call Azure OpenAI
    const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureOpenAIKey = process.env.AZURE_OPENAI_KEY;
    const azureOpenAIDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

    if (!azureOpenAIEndpoint || !azureOpenAIKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    const response = await fetch(
      `${azureOpenAIEndpoint}/openai/deployments/${azureOpenAIDeployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureOpenAIKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      throw new Error(`Azure OpenAI failed: ${response.status}`);
    }

    const responseData = await response.json();
    const aiResponse = responseData.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    res.status(200).json({
      response: aiResponse,
      sources: kbResults.length,
      model: 'azure-gpt-4o'
    });

  } catch (error: any) {
    console.error('Azure KB chat error:', error);
    res.status(500).json({
      error: 'Azure KB chat failed',
      message: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
}
