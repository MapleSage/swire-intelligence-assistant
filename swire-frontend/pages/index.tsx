import { useAuth } from "react-oidc-context";
import SwireChatInterface from "../components/SwireChatInterface";

export default function Home() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "3d51afuu9se41jk2gvmfr040dv";
    const logoutUri = "http://localhost:3000";
    const cognitoDomain = "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (auth.error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return <SwireChatInterface />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <img src="/sageigreen_logo_ wht.png" alt="SageGreen" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Welcome to SageGreen</h1>
        <button 
          onClick={() => auth.signinRedirect()}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}