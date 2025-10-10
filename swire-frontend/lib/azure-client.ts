import { azureConfig } from "./azure-config";

export class AzureClient {
  private openaiEndpoint: string;
  private searchEndpoint: string;
  private cognitiveEndpoint: string;

  constructor() {
    this.openaiEndpoint = azureConfig.openai.endpoint;
    this.searchEndpoint = azureConfig.search.endpoint;
    this.cognitiveEndpoint = azureConfig.cognitive.endpoint;
  }

  // Azure OpenAI Chat Completion
  async chatCompletion(messages: any[], model: string = "gpt-4o"): Promise<any> {
    try {
      const response = await fetch(
        `${this.openaiEndpoint}openai/deployments/${model}/chat/completions?api-version=${azureConfig.openai.apiVersion}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": azureConfig.openai.apiKey,
          },
          body: JSON.stringify({
            messages,
            max_tokens: 4000,
            temperature: 0.7,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Azure OpenAI error:", error);
      throw error;
    }
  }

  // Azure Cognitive Search
  async searchDocuments(query: string, top: number = 5): Promise<any> {
    try {
      const response = await fetch(
        `${this.searchEndpoint}indexes/${azureConfig.search.indexName}/docs/search?api-version=2023-11-01`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": azureConfig.search.apiKey,
          },
          body: JSON.stringify({
            search: query,
            top,
            select: "content,title,metadata",
            searchMode: "all",
            queryType: "semantic",
            semanticConfiguration: "default",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Azure Search API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Azure Search error:", error);
      throw error;
    }
  }

  // Document Analysis
  async analyzeDocument(documentUrl: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.cognitiveEndpoint}formrecognizer/documentModels/prebuilt-document:analyze?api-version=2023-07-31`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": azureConfig.cognitive.apiKey,
          },
          body: JSON.stringify({
            urlSource: documentUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Document Analysis API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Document Analysis error:", error);
      throw error;
    }
  }

  // Speech to Text
  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.wav");

      const response = await fetch(
        `${azureConfig.speech.sttEndpoint}/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureConfig.speech.apiKey,
            "Content-Type": "audio/wav",
          },
          body: audioBlob,
        }
      );

      if (!response.ok) {
        throw new Error(`Speech to Text API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.DisplayText || "";
    } catch (error) {
      console.error("Speech to Text error:", error);
      throw error;
    }
  }

  // Text to Speech
  async textToSpeech(text: string): Promise<Blob> {
    try {
      const ssml = `
        <speak version='1.0' xml:lang='en-US'>
          <voice xml:lang='en-US' xml:gender='Female' name='en-US-JennyNeural'>
            ${text}
          </voice>
        </speak>
      `;

      const response = await fetch(
        `${azureConfig.speech.ttsEndpoint}/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": azureConfig.speech.apiKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          },
          body: ssml,
        }
      );

      if (!response.ok) {
        throw new Error(`Text to Speech API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Text to Speech error:", error);
      throw error;
    }
  }
}

export const azureClient = new AzureClient();