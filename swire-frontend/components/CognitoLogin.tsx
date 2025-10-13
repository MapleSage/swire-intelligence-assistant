import React from 'react';

const CognitoLogin: React.FC = () => {
  const handleLogin = () => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_URI || 'https://sagegreen.vercel.app/auth/callback');
    
    const loginUrl = `${domain}/login?client_id=${clientId}&response_type=code&scope=email+profile&redirect_uri=${redirectUri}`;
    
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swire Intelligence</h1>
          <p className="text-gray-600">Enterprise AI Assistant</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors">
          Sign In with Cognito
        </button>
      </div>
    </div>
  );
};

export default CognitoLogin;