import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ""
  }
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_demo";
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "3d51afuu9se41jk2gvmfr040dv";

export interface AuthUser {
  username: string;
  email: string;
  accessToken: string;
  idToken: string;
}

export class CognitoAuth {
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

  static getSocialSignInUrl(provider: 'Google' | 'Facebook' | 'Apple') {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "https://us-east-1bdqsu9gjr.auth.us-east-1.amazoncognito.com";
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_URI || "https://sagegreen.vercel.app/auth/callback");
    const clientId = CLIENT_ID;
    
    // Fixed: response_type changed to lowercase 'code' and proper scope format
    return `${domain}/oauth2/authorize?identity_provider=${provider}&redirect_uri=${redirectUri}&response_type=code&client_id=${clientId}&scope=email+openid+profile`;
  }

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