export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: number;
}