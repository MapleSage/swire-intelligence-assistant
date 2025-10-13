import { AuthProvider } from "../lib/auth-context";
import type { AppProps } from "next/app";
import "../styles/globals.css";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_bdqsU9GjR", // Replace with your actual User Pool ID
  client_id: "3d51afuu9se41jk2gvmfr040dv",
  redirect_uri: typeof window !== 'undefined' ? window.location.origin + "/auth/callback" : "https://sagegreen.vercel.app/auth/callback",
  response_type: "code",
  scope: "email openid profile",
  post_logout_redirect_uri: typeof window !== 'undefined' ? window.location.origin : "https://sagegreen.vercel.app",
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;