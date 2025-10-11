// Knowledge Base API integration for SageGreen
export interface KnowledgeBaseQuery {
  query: string;
  category?: string;
  limit?: number;
}

export interface KnowledgeBaseResult {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
}

export class KnowledgeBaseAPI {
  private static instance: KnowledgeBaseAPI;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_KB_API_URL || 'http://localhost:8000';
  }

  static getInstance(): KnowledgeBaseAPI {
    if (!KnowledgeBaseAPI.instance) {
      KnowledgeBaseAPI.instance = new KnowledgeBaseAPI();
    }
    return KnowledgeBaseAPI.instance;
  }

  async searchKnowledgeBase(query: KnowledgeBaseQuery): Promise<KnowledgeBaseResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search-kb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`KB search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  async getWindTurbineServices(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/wind-turbine-services`);
      if (!response.ok) {
        throw new Error(`Failed to fetch wind turbine services: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Wind turbine services error:', error);
      return null;
    }
  }
}