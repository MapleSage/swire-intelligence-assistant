import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";
import SwireChatInterface from "../components/SwireChatInterface";

export default function Home() {
  const auth = useAuth();
  const router = useRouter();

  const handleSocialLogin = (provider: 'Google' | 'Facebook' | 'LoginWithAmazon') => {
    const clientId = "3d51afuu9se41jk2gvmfr040dv";
    const cognitoDomain = "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";
    const redirectUri = encodeURIComponent(
      typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : "https://sagegreen.vercel.app/auth/callback"
    );
    
    window.location.href = `${cognitoDomain}/oauth2/authorize?identity_provider=${provider}&redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=email+openid+profile`;
  };

  const handleSignOut = async () => {
    const clientId = "3d51afuu9se41jk2gvmfr040dv";
    const cognitoDomain = "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";
    const logoutUri = encodeURIComponent(
      typeof window !== 'undefined' 
        ? window.location.origin
        : "https://sagegreen.vercel.app"
    );
    
    await auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md border border-gray-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{auth.error.message}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="relative">
        <SwireChatInterface />
        <button
          onClick={handleSignOut}
          className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 shadow-lg z-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <img src="/sageigreen_logo_ wht.png" alt="SageGreen" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to SageGreen</h1>
          <p className="text-gray-600 mt-2">Renewable Energy AI Assistant</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-gray-700">Continue with Google</span>
          </button>

          <button
            onClick={() => handleSocialLogin('Facebook')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">f</span>
            </div>
            <span className="text-gray-700">Continue with Facebook</span>
          </button>

          <button
            onClick={() => handleSocialLogin('LoginWithAmazon')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-gray-700">Continue with Amazon</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => auth.signinRedirect()}
            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Sign in with Email
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}