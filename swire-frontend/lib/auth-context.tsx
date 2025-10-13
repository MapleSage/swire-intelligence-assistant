import { createContext, useContext, useState, useEffect } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAuthSession();
        setSession(data);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = async () => {
    await signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);