import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth-context";
import SwireChatInterface from "../components/SwireChatInterface";

export default function Home() {
  const router = useRouter();
  const { session, loading, isAuthenticated, loginWithHostedUI } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to Cognito hosted UI
      loginWithHostedUI();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Redirecting to login...</div>
      </div>
    );
  }

  return <SwireChatInterface />;
}