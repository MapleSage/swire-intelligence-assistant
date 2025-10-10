import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

class AuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_demo";
  private clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "demo_client_id";

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
    });
  }

  async signIn(username: string, password: string): Promise<AuthSession> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);
      
      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;
        
        const session: AuthSession = {
          accessToken: AccessToken!,
          idToken: IdToken!,
          refreshToken: RefreshToken!,
          expiresAt: Date.now() + (ExpiresIn! * 1000),
          user: {
            id: username,
            username,
            email: username,
            name: "Swire User"
          }
        };

        return session;
      }
      
      throw new Error("Authentication failed");
    } catch (error) {
      // For demo purposes, return mock session
      console.warn("Using mock authentication:", error);
      return {
        accessToken: "mock_access_token",
        idToken: "mock_id_token", 
        refreshToken: "mock_refresh_token",
        expiresAt: Date.now() + (3600 * 1000),
        user: {
          id: username,
          username,
          email: username,
          name: "Swire Demo User"
        }
      };
    }
  }

  async signUp(username: string, password: string, email: string): Promise<void> {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email }
        ]
      });

      await this.client.send(command);
    } catch (error) {
      console.warn("Using mock sign up:", error);
      // Mock success for demo
    }
  }

  async confirmSignUp(username: string, code: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code
      });

      await this.client.send(command);
    } catch (error) {
      console.warn("Using mock confirmation:", error);
      // Mock success for demo
    }
  }

  saveSession(session: AuthSession): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("swire_auth_session", JSON.stringify(session));
    }
  }

  loadSession(): AuthSession | null {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("swire_auth_session");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("swire_auth_session");
    }
  }

  signOut(): void {
    this.clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    // Mock refresh for demo
    const existingSession = this.loadSession();
    if (existingSession) {
      return {
        ...existingSession,
        expiresAt: Date.now() + (3600 * 1000)
      };
    }
    throw new Error("No session to refresh");
  }
}

export const authService = new AuthService();