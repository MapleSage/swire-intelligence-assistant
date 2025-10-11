import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  // Simple mock responses that actually work
  let response = "I'm SageGreen, your AI assistant for renewable energy solutions.";
  
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('financial') || lowerQuery.includes('finance')) {
    response = "**Financial Summary**\n- Monthly Revenue: $486,900\n- Monthly Expenses: $340,830\n- Net Profit: $146,070 (30% margin)";
  } else if (lowerQuery.includes('man-hours') || lowerQuery.includes('hours')) {
    response = "**Man-Hours Report**\n- Total: 45,000 hours this month\n- Site A: 12,000 hours\n- Site B: 10,500 hours\n- Site C: 8,200 hours";
  } else if (lowerQuery.includes('safety') || lowerQuery.includes('ppe')) {
    response = "**Safety Guidelines**\n- Hard hats required on all sites\n- Safety glasses mandatory\n- High-visibility vests\n- Steel-toed boots";
  } else if (lowerQuery.includes('wind') || lowerQuery.includes('turbine')) {
    response = "**Wind Energy Services**\n- Blade maintenance and repair\n- Turbine installation\n- Electrical systems\n- Preventive maintenance";
  }

  res.status(200).json({ response });
}