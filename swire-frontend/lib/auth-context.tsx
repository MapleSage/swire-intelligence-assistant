import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAuthSession, signOut, signInWithRedirect } from "aws-amplify/auth";

interface AuthContextType {
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  loginWithProvider: (provider: 'Google' | 'Facebook' | 'Amazon') => Promise<void>;
  loginWithHostedUI: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await fetchAuthSession();
      console.log('Auth session:', data);
      setSession(data);
    } catch (error) {
      console.log('No active session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loginWithProvider = async (provider: 'Google' | 'Facebook' | 'Amazon') => {
    try {
      await signInWithRedirect({ provider });
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  const loginWithHostedUI = async () => {
    try {
      await signInWithRedirect();
    } catch (error) {
      console.error('Hosted UI login error:', error);
    }
  };

  const isAuthenticated = !!session?.tokens;

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      isAuthenticated,
      logout,
      loginWithProvider,
      loginWithHostedUI
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};