interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    type: string;
    uploadedAt: string;
    tags: string[];
  };
  embedding?: number[];
}

export class KnowledgeBase {
  private static readonly SEARCH_ENDPOINT = "https://ai-parvinddutta9607ai577068173144.search.windows.net";
  private static readonly INDEX_NAME = "swire-knowledge-index";
  private static readonly API_KEY = process.env.AZURE_SEARCH_KEY || "";

  // Add document to knowledge base
  static async addDocument(document: Omit<KnowledgeDocument, 'id'>): Promise<string> {
    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const searchDocument = {
        "@search.action": "upload",
        id: docId,
        title: document.title,
        content: document.content,
        source: document.metadata.source,
        type: document.metadata.type,
        uploadedAt: document.metadata.uploadedAt,
        tags: document.metadata.tags.join(", ")
      };

      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/docs/index?api-version=2023-11-01`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.API_KEY,
          },
          body: JSON.stringify({
            value: [searchDocument]
          }),
        }
      );

      if (response.ok) {
        return docId;
      } else {
        throw new Error(`Failed to add document: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error adding document to knowledge base:", error);
      throw error;
    }
  }

  // Search knowledge base
  static async search(query: string, top: number = 5): Promise<KnowledgeDocument[]> {
    try {
      const searchParams = {
        search: query,
        top: top,
        highlight: "content",
        searchMode: "all",
        queryType: "semantic",
        semanticConfiguration: "default"
      };

      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/docs/search?api-version=2023-11-01`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.API_KEY,
          },
          body: JSON.stringify(searchParams),
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.value.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          metadata: {
            source: doc.source,
            type: doc.type,
            uploadedAt: doc.uploadedAt,
            tags: doc.tags ? doc.tags.split(", ") : []
          }
        }));
      } else {
        throw new Error(`Search failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      return [];
    }
  }

  // Get document by ID
  static async getDocument(id: string): Promise<KnowledgeDocument | null> {
    try {
      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/docs('${id}')?api-version=2023-11-01`,
        {
          method: "GET",
          headers: {
            "api-key": this.API_KEY,
          },
        }
      );

      if (response.ok) {
        const doc = await response.json();
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          metadata: {
            source: doc.source,
            type: doc.type,
            uploadedAt: doc.uploadedAt,
            tags: doc.tags ? doc.tags.split(", ") : []
          }
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting document:", error);
      return null;
    }
  }

  // Update document
  static async updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<boolean> {
    try {
      const searchDocument = {
        "@search.action": "merge",
        id: id,
        ...updates,
        tags: updates.metadata?.tags?.join(", ")
      };

      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/docs/index?api-version=2023-11-01`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.API_KEY,
          },
          body: JSON.stringify({
            value: [searchDocument]
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error updating document:", error);
      return false;
    }
  }

  // Delete document
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const searchDocument = {
        "@search.action": "delete",
        id: id
      };

      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/docs/index?api-version=2023-11-01`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": this.API_KEY,
          },
          body: JSON.stringify({
            value: [searchDocument]
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }

  // Get knowledge base statistics
  static async getStats(): Promise<{ totalDocuments: number; lastUpdated: string }> {
    try {
      const response = await fetch(
        `${this.SEARCH_ENDPOINT}/indexes/${this.INDEX_NAME}/stats?api-version=2023-11-01`,
        {
          method: "GET",
          headers: {
            "api-key": this.API_KEY,
          },
        }
      );

      if (response.ok) {
        const stats = await response.json();
        return {
          totalDocuments: stats.documentCount || 0,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return { totalDocuments: 0, lastUpdated: new Date().toISOString() };
    } catch (error) {
      console.error("Error getting knowledge base stats:", error);
      return { totalDocuments: 0, lastUpdated: new Date().toISOString() };
    }
  }

  // Process and add document from upload
  static async processAndAddDocument(
    content: string, 
    filename: string, 
    type: string
  ): Promise<string> {
    const document = {
      title: filename,
      content: content,
      metadata: {
        source: "upload",
        type: type,
        uploadedAt: new Date().toISOString(),
        tags: [type, "processed", "swire"]
      }
    };

    return await this.addDocument(document);
  }
}