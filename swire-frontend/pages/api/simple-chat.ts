import { NextApiRequest, NextApiResponse } from 'next';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    const client = new BedrockRuntimeClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      body: JSON.stringify({
        messages: [{ 
          role: 'user', 
          content: `You are SageGreen, a renewable energy AI assistant with access to industry knowledge base.

## Sample Data Available:
**Financial Summary (Current Month):**
- Total Revenue: $2.4M
- Wind Energy Projects: $1.8M (75%)
- Solar Projects: $600K (25%)
- Operating Costs: $1.2M
- Net Profit: $1.2M
- ROI: 50%

**Man-Hours by Site:**
- Wind Farm Alpha: 2,400 hours
- Solar Park Beta: 1,800 hours
- Maintenance Hub: 1,200 hours
- R&D Center: 800 hours

**PPE Requirements:**
- Hard hats (ANSI Z89.1)
- Safety harnesses for heights >6ft
- Cut-resistant gloves (Level A3)
- Safety glasses with side shields
- High-visibility vests
- Steel-toe boots
- Fall protection equipment for turbine work

**Dashboard Metrics:**
- Energy Production: 45 GWh this month
- Capacity Factor: 32%
- Turbine Availability: 97.2%
- Safety Incidents: 0
- Carbon Offset: 22,500 tons CO2

User Query: ${query}` 
        }],
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
    });

  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'API failed',
      message: error.message,
      response: 'I apologize, but I encountered an error. Please try again.'
    });
  }
}