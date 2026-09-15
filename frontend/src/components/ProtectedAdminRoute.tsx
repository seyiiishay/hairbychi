import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Spinner } from "./Shared";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
