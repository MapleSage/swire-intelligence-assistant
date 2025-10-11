import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_bdqsU9GjR",
  client_id: "3d51afuu9se41jk2gvmfr040dv",
  redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/auth/callback",
  response_type: "code",
  scope: "email openid phone",
};

interface OIDCAuthProviderProps {
  children: ReactNode;
}

export const OIDCAuthProvider: React.FC<OIDCAuthProviderProps> = ({ children }) => {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      {children}
    </AuthProvider>
  );
};

export const useOIDCAuth = () => {
  const auth = useAuth();
  
  const signOutRedirect = () => {
    const clientId = "3d51afuu9se41jk2gvmfr040dv";
    const logoutUri = "http://localhost:3000";
    const cognitoDomain = "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return {
    ...auth,
    signOutRedirect
  };
};