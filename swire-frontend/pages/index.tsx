import React from "react";
import { useOIDCAuth } from "../lib/oidc-auth";
import SwireChatInterface from "../components/SwireChatInterface";
import { Bot } from "lucide-react";

export default function Home() {
  const auth = useOIDCAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SageGreen Intelligence...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Authentication error: {auth.error.message}</p>
          <button 
            onClick={() => auth.signinRedirect()} 
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">SageGreen Intelligence</h1>
          <p className="text-gray-600 mb-8">AI Assistant for Renewable Energy</p>
          <button 
            onClick={() => auth.signinRedirect()} 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <SwireChatInterface />;
}