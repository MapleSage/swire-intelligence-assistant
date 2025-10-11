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
      case "azure": return "text-blue-400 bg-blue-500/20";
      case "bedrock": return "text-orange-400 bg-orange-500/20";
      case "local": return "text-emerald-400 bg-emerald-500/20";
      default: return "text-slate-400 bg-slate-500/20";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-3 bg-slate-700 border border-slate-600 rounded-xl hover:bg-slate-600 transition-all duration-200 w-full">
        
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Brain className="w-4 h-4 text-emerald-400" />
        </div>
        
        <div className="flex-1 text-left">
          <div className="font-medium text-white text-sm">{selectedModelData.name}</div>
          <div className="text-xs text-slate-400 truncate">{selectedModelData.description}</div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full p-4 text-left hover:bg-slate-700 transition-all duration-200 border-b border-slate-700 last:border-b-0 ${
                model.id === selectedModel ? "bg-emerald-900/30 border-emerald-600" : ""
              }`}>
              
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  {model.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white text-sm">{model.name}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                      {model.provider.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-2">{model.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((capability, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
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