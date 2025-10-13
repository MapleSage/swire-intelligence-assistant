import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SwireChatInterface from "../components/SwireChatInterface";
import { CognitoAuth } from "../lib/cognito-auth";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const accessToken = localStorage.getItem('access_token');
      const idToken = localStorage.getItem('id_token');
      
      if (accessToken && idToken) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // Not authenticated - redirect to Cognito
        setIsLoading(false);
        CognitoAuth.redirectToHostedUI();
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative">
        <SwireChatInterface />
        <button
          onClick={() => CognitoAuth.logout()}
          className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 shadow-lg z-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Redirecting to Cognito...
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600 text-xl">Redirecting to login...</div>
    </div>
  );
}