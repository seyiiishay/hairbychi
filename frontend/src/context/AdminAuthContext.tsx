import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAdminToken, setAdminToken } from "../api/client";

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    setIsAuthenticated(Boolean(token));
    setUsername(token ? "admin" : null);
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    setAdminToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    setAdminToken(null);
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
