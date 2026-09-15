import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAdminToken, setAdminToken } from "../api/client";
import { adminSessionCheck, adminLogout as apiLogout } from "../api/endpoints";

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
    if (!token) {
      setIsLoading(false);
      return;
    }
    adminSessionCheck()
      .then((data) => {
        setIsAuthenticated(true);
        setUsername(data.username);
      })
      .catch(() => {
        setAdminToken(null);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (token: string) => {
    setAdminToken(token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore — we're clearing local state regardless
    }
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
