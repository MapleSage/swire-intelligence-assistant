import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ""
  }
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_bdqsU9GjR";
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "3d51afuu9se41jk2gvmfr040dv";
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";

export interface AuthUser {
  username: string;
  email: string;
  accessToken: string;
  idToken: string;
}

export class CognitoAuth {
  // Get the redirect URI based on current environment
  private static getRedirectUri(): string {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_REDIRECT_URI || "https://sagegreen.vercel.app/auth/callback";
    }
    return `${window.location.origin}/auth/callback`;
  }

  // Redirect to Cognito hosted UI (shows all providers)
  static redirectToHostedUI() {
    const redirectUri = encodeURIComponent(this.getRedirectUri());
    window.location.href = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
  }

  // Redirect to specific social provider
  static redirectToSocialProvider(provider: 'Google' | 'Facebook' | 'LoginWithAmazon') {
    const redirectUri = encodeURIComponent(this.getRedirectUri());
    window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=${provider}&redirect_uri=${redirectUri}&response_type=code&client_id=${CLIENT_ID}&scope=email+openid+profile`;
  }

  // Logout
  static logout() {
    const logoutUri = encodeURIComponent(
      typeof window !== 'undefined' ? window.location.origin : "https://sagegreen.vercel.app"
    );
    
    // Clear local tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
    }
    
    // Redirect to Cognito logout
    window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${logoutUri}`;
  }

  // Legacy methods (keeping for backward compatibility but not recommended for hosted UI flow)
  static async signUp(email: string, password: string, name: string) {
    try {
      const command = new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name }
        ]
      });
      
      const response = await cognitoClient.send(command);
      return { success: true, userSub: response.UserSub };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async confirmSignUp(email: string, code: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code
      });
      
      await cognitoClient.send(command);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const command = new InitiateAuthCommand({
        ClientId: CLIENT_ID,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });
      
      const response = await cognitoClient.send(command);
      
      if (response.AuthenticationResult) {
        return {
          success: true,
          user: {
            username: email,
            email: email,
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken
          }
        };
      }
      
      return { success: false, error: "Authentication failed" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // DEPRECATED: Use redirectToSocialProvider instead
  static getSocialSignInUrl(provider: 'Google' | 'Facebook' | 'Apple') {
    const redirectUri = encodeURIComponent(this.getRedirectUri());
    return `${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=${provider}&redirect_uri=${redirectUri}&response_type=code&client_id=${CLIENT_ID}&scope=email+openid+profile`;
  }

  // Biometric methods (keep as is)
  static async setupBiometric(userId: string) {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported");
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "SageGreen Intelligence",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: "SageGreen User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      localStorage.setItem('biometric_credential', JSON.stringify({
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type
      }));

      return { success: true, credentialId: credential.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async authenticateWithBiometric() {
    try {
      const storedCredential = localStorage.getItem('biometric_credential');
      if (!storedCredential) {
        throw new Error("No biometric credential found");
      }

      const credentialInfo = JSON.parse(storedCredential);
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: new Uint8Array(credentialInfo.rawId),
          type: "public-key"
        }],
        timeout: 60000,
        userVerification: "required"
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      return { success: true, assertion };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async setupFaceRecognition() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      const faceTemplate = await this.captureFaceTemplate(stream);
      localStorage.setItem('face_template', JSON.stringify(faceTemplate));
      
      stream.getTracks().forEach(track => track.stop());
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static async captureFaceTemplate(stream: MediaStream) {
    return {
      timestamp: Date.now(),
      deviceId: navigator.userAgent,
      template: "face_template_data"
    };
  }

  static async authenticateWithFace() {
    try {
      const storedTemplate = localStorage.getItem('face_template');
      if (!storedTemplate) {
        throw new Error("No face template found");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      const currentTemplate = await this.captureFaceTemplate(stream);
      stream.getTracks().forEach(track => track.stop());
      
      const match = JSON.parse(storedTemplate).deviceId === currentTemplate.deviceId;
      
      return { success: match };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}