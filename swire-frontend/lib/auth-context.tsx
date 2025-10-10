import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, AuthSession, User } from "./auth-service";

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, email: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const existingSession = authService.loadSession();
        if (existingSession && existingSession.expiresAt > Date.now()) {
          setSession(existingSession);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const newSession = await authService.signIn(username, password);
      setSession(newSession);
      authService.saveSession(newSession);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, password: string, email: string) => {
    setIsLoading(true);
    try {
      await authService.signUp(username, password, email);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setSession(null);
    authService.signOut();
  };

  const value: AuthContextType = {
    user: session?.user || null,
    session,
    isAuthenticated: !!session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};