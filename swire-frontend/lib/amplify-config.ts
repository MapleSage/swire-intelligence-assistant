import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId:
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_bdqsU9GjR",
      userPoolClientId:
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "3d51afuu9se41jk2gvmfr040dv",
      loginWith: {
        oauth: {
          domain: "us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com",
          scopes: ["email", "profile"],
          redirectSignIn: [
            "http://localhost:3000/auth/callback",
            "https://sagegreen.vercel.app/auth/callback",
          ],
          redirectSignOut: [
            "http://localhost:3000",
            "https://sagegreen.vercel.app",
          ],
          responseType: "code",
          providers: ["Google", "Facebook", "Amazon"],
        },
      },
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig, { ssr: true });