import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    // Try backend first
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({
            response: data.response,
            source: 'backend'
          });
        }
      } catch (backendError) {
        console.log('Backend unavailable, using mock response');
      }
    }
    
    // Mock responses for common queries
    let mockResponse = "I'm SageGreen, your AI assistant for renewable energy solutions.";
    
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('financial') || lowerQuery.includes('finance')) {
      mockResponse = "**Financial Summary**\n- Monthly Revenue: $486,900\n- Monthly Expenses: $340,830\n- Net Profit: $146,070 (30% margin)\n- Key Performance: Wind services generating 65% of revenue";
    } else if (lowerQuery.includes('man-hours') || lowerQuery.includes('hours')) {
      mockResponse = "**Man-Hours Report**\n- Total: 45,000 hours this month\n- Site A: 12,000 hours\n- Site B: 10,500 hours\n- Site C: 8,200 hours\n- Efficiency: 92% utilization rate";
    } else if (lowerQuery.includes('safety') || lowerQuery.includes('ppe')) {
      mockResponse = "**Safety Guidelines**\n- Hard hats required on all sites\n- Safety glasses mandatory\n- High-visibility vests\n- Steel-toed boots\n- Current safety score: 95%";
    } else if (lowerQuery.includes('wind') || lowerQuery.includes('turbine')) {
      mockResponse = "**Wind Energy Services**\n- Blade maintenance and repair\n- Turbine installation\n- Electrical systems\n- Preventive maintenance\n- Emergency response 24/7";
    }

    res.status(200).json({
      response: mockResponse,
      source: 'mock'
    });

  } catch (error: any) {
    console.error('Chat fallback error:', error);
    res.status(500).json({ 
      error: 'Service unavailable',
      response: 'I apologize, but all services are currently unavailable. Please try again later.'
    });
  }
}