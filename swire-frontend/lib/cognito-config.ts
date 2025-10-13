// Cognito configuration for social providers
export const COGNITO_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_bdqsU9GjR",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "3d51afuu9se41jk2gvmfr040dv",
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com",
  
  // Social provider configurations
  socialProviders: {
    google: {
      name: "Google",
      identityProvider: "Google"
    },
    facebook: {
      name: "Facebook", 
      identityProvider: "Facebook"
    },
    amazon: {
      name: "Amazon",
      identityProvider: "LoginWithAmazon"
    }
  },
  
  // OAuth scopes
  scopes: ["email", "openid", "profile"],
  
  // Response type for OAuth flow
  responseType: "code"
};

export const getRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_REDIRECT_URI || "https://sagegreen.vercel.app/auth/callback";
  }
  return `${window.location.origin}/auth/callback`;
};