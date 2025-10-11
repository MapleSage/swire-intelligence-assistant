import React from 'react';
import { useRouter } from 'next/router';
import { Github, Mail } from 'lucide-react';

const LoginPage: React.FC = () => {
  const router = useRouter();

  const handleSocialLogin = (provider: string) => {
    // Store login state and redirect to main app
    localStorage.setItem('user', JSON.stringify({
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      provider
    }));
    router.push('/');
  };

  const handleGuestLogin = () => {
    localStorage.setItem('user', JSON.stringify({
      name: 'Guest User',
      email: 'guest@sagegreen.com',
      provider: 'guest'
    }));
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/sageigreen_logo_ wht.png" alt="SageGreen" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome to SageGreen</h1>
          <p className="text-slate-600 mt-2">Renewable Energy AI Assistant</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => handleSocialLogin('GitHub')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={() => handleSocialLogin('Facebook')}
            className="w-full flex items-center justify-center space-x-3 p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
          >
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">f</span>
            </div>
            <span>Continue with Facebook</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
          >
            <Mail className="w-5 h-5" />
            <span>Continue as Guest</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginPage;