import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import EnhancedAuth from "../components/EnhancedAuth";
import SwireChatInterface from "../components/SwireChatInterface";

export default function Home() {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (credentials: { username: string; password: string }) => {
    setLoginLoading(true);
    setError("");
    
    try {
      await signIn(credentials.username, credentials.password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Swire Intelligence Assistant...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <EnhancedAuth onAuthSuccess={(user) => {
          // Handle successful authentication
          console.log('User authenticated:', user);
        }} />
        {error && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return <SwireChatInterface />;
}