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
      const response = await fetch("/api/bedrock-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: textToSend,
          agentId: "XMJHPK00RO"
        }),
      });

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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">SageGreen</h1>
              <p className="text-sm text-slate-400">AI Assistant</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Model</h3>
            <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
              <ModelSelector 
                selectedModel={selectedModel} 
                onModelChange={setSelectedModel} 
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="w-full flex items-center space-x-3 p-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group">
                <Upload className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                <span>Upload Document</span>
              </button>
              
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-full flex items-center space-x-3 p-3 text-left text-sm rounded-xl transition-all duration-200 group ${
                  isRecording 
                    ? "text-red-300 bg-red-900/30 hover:bg-red-900/50" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}>
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-red-400" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                )}
                <span>{isRecording ? "Stop Recording" : "Voice Input"}</span>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.query)}
                  className="w-full flex items-center space-x-3 p-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all duration-200 group">
                  <action.icon className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={auth.signOutRedirect}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">Chat with SageGreen</h2>
          <p className="text-sm text-slate-600 mt-1">Ask about finances, operations, safety, and more</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-4xl p-5 rounded-2xl shadow-sm ${
                  message.sender === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                    : "bg-white border border-slate-200 text-slate-900"
                }`}>
                <div className="flex items-start space-x-3">
                  {message.sender === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
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
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about renewable energy, wind turbines, or anything else..."
                className="w-full p-4 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white shadow-sm"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Upload Document">
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Take Screenshot">
                <Monitor className="w-5 h-5" />
              </button>
              <button
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Camera">
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isRecording 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Voice Input">
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg">
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