import React, { useState } from "react";
import { ChevronDown, Brain, Zap, Shield, Globe } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  provider: "azure" | "bedrock" | "local";
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const models: Model[] = [
    {
      id: "gpt-4o",
      name: "GPT-4o (Azure)",
      description: "Most capable model for complex reasoning and analysis",
      icon: <Brain className="w-4 h-4" />,
      capabilities: ["Advanced reasoning", "Document analysis", "Code generation"],
      provider: "azure",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo (Azure)",
      description: "Fast and efficient for most tasks",
      icon: <Zap className="w-4 h-4" />,
      capabilities: ["Fast responses", "General knowledge", "Creative tasks"],
      provider: "azure",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet (Bedrock)",
      description: "Excellent for analysis and safety-focused responses",
      icon: <Shield className="w-4 h-4" />,
      capabilities: ["Safety analysis", "Document review", "Compliance"],
      provider: "bedrock",
    },
    {
      id: "sage-gpt",
      name: "SageGPT Agent",
      description: "Specialized Swire domain expert",
      icon: <Globe className="w-4 h-4" />,
      capabilities: ["Swire knowledge", "Industry expertise", "Custom training"],
      provider: "azure",
    },
  ];

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0];

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "azure": return "text-blue-600 bg-blue-50";
      case "bedrock": return "text-orange-600 bg-orange-50";
      case "local": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors w-full min-w-64">
        
        <div className={`p-2 rounded-lg ${getProviderColor(selectedModelData.provider)}`}>
          {selectedModelData.icon}
        </div>
        
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">{selectedModelData.name}</div>
          <div className="text-sm text-gray-500 truncate">{selectedModelData.description}</div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                model.id === selectedModel ? "bg-green-50 border-green-200" : ""
              }`}>
              
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getProviderColor(model.provider)}`}>
                  {model.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{model.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getProviderColor(model.provider)}`}>
                      {model.provider.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;