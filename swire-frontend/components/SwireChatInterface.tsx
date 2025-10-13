import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, LogOut, BarChart3, Users, Shield, TrendingUp, Upload, Settings, Mic, MicOff, Camera, Paperclip, Globe, Monitor, Copy, Volume2, ThumbsUp, ThumbsDown, RotateCcw, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../lib/auth-context";
import DocumentUpload from "./DocumentUpload";
import ModelSelector from "./ModelSelector";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const SwireChatInterface: React.FC = () => {
  const { session, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get user info from Amplify session
    if (session?.tokens?.idToken) {
      const idToken = session.tokens.idToken;
      setUser({
        email: idToken.payload.email,
        name: idToken.payload.name || idToken.payload.email,
        sub: idToken.payload.sub
      });
    }
  }, [session]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm SageGreen, your renewable energy AI assistant with industry knowledge base access. I can help you with:\n\n• **Financial Analytics** - Revenue, costs, and ROI analysis\n• **Operations Data** - Man-hours, site metrics, and performance\n• **Safety Management** - PPE requirements and safety protocols\n• **Dashboard Insights** - Energy production and efficiency metrics\n• **Technical Support** - Wind and solar system guidance\n\nI have access to sample industry data for demonstrations. What would you like to explore?",
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
      // Get access token from Amplify session
      const accessToken = session?.tokens?.accessToken?.toString();
      
      const response = await fetch("/api/simple-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
        },
        body: JSON.stringify({ 
          query: textToSend,
          model: selectedModel
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
      console.error("Message error:", error);
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
        
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.wav");
          
          const accessToken = session?.tokens?.accessToken?.toString();
          
          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            headers: {
              ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
            },
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    console.log(`Feedback ${type} for message ${messageId}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-700 bg-gradient-to-br from-emerald-500 to-teal-600">
          <div className="flex items-center space-x-3">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg">
              <img src="/sageigreen_logo_ wht.png" alt="SageGreen" className="w-20 h-20 rounded-xl object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">SageGreen</h1>
              <p className="text-sm text-slate-200">Renewable Energy AI</p>
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
              <div className="flex flex-col">
                <span className="text-sm text-slate-300 font-medium truncate max-w-[150px]">
                  {user?.name || user?.email || 'User'}
                </span>
                {user?.email && user?.name !== user?.email && (
                  <span className="text-xs text-slate-500 truncate max-w-[150px]">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
              title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">Renewable Energy Assistant</h2>
          <p className="text-sm text-slate-600 mt-1">Financial data, operations metrics, safety protocols, and industry insights</p>
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
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <img src="/SageGreen-1.png" alt="SageGreen" className="w-8 h-8 rounded-xl" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none overflow-hidden">
                      <ReactMarkdown className="break-words">
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs opacity-70 mt-2 flex items-center justify-between">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.sender === "assistant" && (
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 hover:bg-slate-100 rounded" 
                            title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => readAloud(message.content)}
                            className="p-1 hover:bg-slate-100 rounded" 
                            title="Read aloud">
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(message.id, 'up')}
                            className="p-1 hover:bg-slate-100 rounded" 
                            title="Good response">
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleFeedback(message.id, 'down')}
                            className="p-1 hover:bg-slate-100 rounded" 
                            title="Bad response">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
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
                title="Add attachment">
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.open('https://www.google.com', '_blank')}
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Browse web">
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Upload file">
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isRecording 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
                title="Voice input">
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