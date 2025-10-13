import React from 'react';
import { CognitoAuth } from '../lib/cognito-auth';

const SocialLoginButtons: React.FC = () => {
  const handleGoogleLogin = () => {
    CognitoAuth.redirectToSocialProvider('Google');
  };

  const handleFacebookLogin = () => {
    CognitoAuth.redirectToSocialProvider('Facebook');
  };

  const handleAmazonLogin = () => {
    CognitoAuth.redirectToSocialProvider('LoginWithAmazon');
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <button
        onClick={handleFacebookLogin}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Continue with Facebook
      </button>

      <button
        onClick={handleAmazonLogin}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 transition-colors"
      >
        <svg className="w-5 h-5 mr-3" fill="#FF9900" viewBox="0 0 24 24">
          <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726-1.548.41-3.156.615-4.83.615-3.495 0-6.756-.682-9.78-2.044-.304-.138-.57-.28-.81-.43-.24-.15-.36-.3-.36-.45 0-.12.046-.226.135-.33l.158-.185zm23.565-1.68c-.12-.196-.24-.46-.36-.79-.12-.33-.226-.63-.315-.9-.09-.27-.18-.51-.27-.72-.09-.21-.18-.39-.27-.54-.09-.15-.18-.27-.27-.36-.09-.09-.18-.135-.27-.135-.12 0-.226.045-.315.135-.09.09-.135.21-.135.36 0 .15.045.33.135.54.09.21.18.45.27.72.09.27.195.57.315.9.12.33.24.594.36.79.12.196.24.346.36.45.12.104.24.15.36.15.12 0 .226-.046.315-.15.09-.104.135-.254.135-.45 0-.196-.045-.394-.135-.594z"/>
        </svg>
        Continue with Amazon
      </button>
    </div>
  );
};

export default SocialLoginButtons;