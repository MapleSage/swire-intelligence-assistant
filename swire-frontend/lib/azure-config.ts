export const azureConfig = {
  // Azure OpenAI
  openai: {
    endpoint: "https://ai-parvinddutta9607ai577068173144.openai.azure.com/",
    apiVersion: "2024-02-15-preview",
    deploymentName: "gpt-4o",
    apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY || "",
  },

  // Azure AI Services
  aiServices: {
    endpoint: "https://ai-parvinddutta9607ai577068173144.services.ai.azure.com/",
    apiKey: process.env.NEXT_PUBLIC_AZURE_AI_KEY || "",
  },

  // Cognitive Services
  cognitive: {
    endpoint: "https://ai-parvinddutta9607ai577068173144.cognitiveservices.azure.com/",
    apiKey: process.env.NEXT_PUBLIC_AZURE_COGNITIVE_KEY || "",
  },

  // Speech Services
  speech: {
    sttEndpoint: "https://eastus.stt.speech.microsoft.com",
    ttsEndpoint: "https://eastus.tts.speech.microsoft.com",
    apiKey: process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || "",
    region: "eastus",
  },

  // SageGPT Agent
  agent: {
    id: "asst_yJtPjKLr04mCRtSgmhMgwMLA",
    name: "SageGPT",
    connectionId: "/subscriptions/5e875b0e-0514-4c35-b9c8-251d16f6cbd0/resourceGroups/rg-maplesage-openai-project/providers/Microsoft.MachineLearningServices/workspaces/maplesage-openai-project/connections/ai-parvinddutta9607ai577068173144_aoai",
  },

  // Cognitive Search
  search: {
    endpoint: "https://ai-parvinddutta9607ai577068173144.search.windows.net/",
    apiKey: process.env.NEXT_PUBLIC_AZURE_SEARCH_KEY || "",
    indexName: "swire-knowledge-index",
  },
};