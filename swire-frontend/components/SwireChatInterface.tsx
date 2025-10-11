import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, LogOut, BarChart3, Users, Shield, TrendingUp, Upload, Settings, Mic, MicOff, Camera, Paperclip, Globe, Monitor } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useOIDCAuth } from "../lib/oidc-auth";
import DocumentUpload from "./DocumentUpload";
import ModelSelector from "./ModelSelector";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const SwireChatInterface: React.FC = () => {
  const auth = useOIDCAuth();
  const user = auth.user?.profile;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm SageGreen, your AI assistant with advanced knowledge integration. I can help you with:\n\n• **Wind Turbine Services** - Blade maintenance, installation, electrical systems\n• **Renewable Energy** - Solar, wind, and sustainable energy solutions\n• **Technical Documentation** - Upload and analyze technical documents\n• **Voice interaction** - Speak your questions\n• **Industry Insights** - Latest renewable energy trends and data\n\nWhat would you like to know?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Try Azure OpenAI first, fallback to Bedrock
      let response;
      try {
        response = await fetch("/api/azure-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query: textToSend }),
        });
      } catch (azureError) {
        // Fallback to Bedrock agent
        response = await fetch("/api/bedrock-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            query: textToSend,
            agentId: "XMJHPK00RO"
          }),
        });
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request.",
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, there was an error connecting to the service. Please try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        
        // Process audio with Azure Speech Services
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.wav");
          
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          
          const data = await response.json();
          if (data.text) {
            setInputMessage(data.text);
          }
        } catch (error) {
          console.error("Speech to text error:", error);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (error) {
      console.error("Voice recording error:", error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleDocumentProcessed = (content: string, metadata: any) => {
    const documentMessage: Message = {
      id: Date.now().toString(),
      content: `📄 Document uploaded: **${metadata.filename}**\n\nAnalyzing document content...`,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, documentMessage]);
    setShowDocumentUpload(false);
    
    // Send document content for analysis
    setTimeout(() => {
      sendMessage(`Please analyze this document: ${content.substring(0, 2000)}...`);
    }, 1000);
  };

  const quickActions = [
    { icon: BarChart3, label: "Financial Summary", query: "Show me this month's financial summary" },
    { icon: Users, label: "Man-Hours Report", query: "Show me total man-hours by site" },
    { icon: Shield, label: "Safety Guidelines", query: "What are the PPE requirements?" },
    { icon: TrendingUp, label: "Dashboard Overview", query: "Generate a dashboard summary" },
  ];

  const handleQuickAction = (query: string) => {
    setInputMessage(query);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">SageGreen</h1>
              <p className="text-sm text-gray-500">AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">AI Model</h3>
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelChange={setSelectedModel} 
            />
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="w-full flex items-center space-x-3 p-3 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Document</span>
              </button>
              
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-full flex items-center space-x-3 p-3 text-left text-sm rounded-lg transition-colors ${
                  isRecording 
                    ? "text-red-700 bg-red-50 hover:bg-red-100" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}>
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-red-600" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-600" />
                )}
                <span>{isRecording ? "Stop Recording" : "Voice Input"}</span>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.query)}
                  className="w-full flex items-center space-x-3 p-3 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <action.icon className="w-4 h-4 text-green-600" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 w-80 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={auth.signOutRedirect}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat with SageGreen</h2>
          <p className="text-sm text-gray-500">Ask about finances, operations, safety, and more</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-3xl p-4 rounded-lg ${
                  message.sender === "user"
                    ? "bg-green-600 text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}>
                <div className="flex items-start space-x-3">
                  {message.sender === "assistant" && (
                    <Bot className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-green-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about renewable energy, wind turbines, or anything else..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Upload Document">
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Take Screenshot">
                <Monitor className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Camera">
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title="Voice Input">
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <DocumentUpload
          onDocumentProcessed={handleDocumentProcessed}
          onClose={() => setShowDocumentUpload(false)}
        />
      )}
    </div>
  );
};

export default SwireChatInterface;