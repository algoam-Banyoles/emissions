import { type ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/stores/auth.store";

interface ProtectedRouteProps {
  children?: ReactElement;
  requiredRole?: string;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.rol);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const rolesToCheck = requiredRoles ?? (requiredRole ? [requiredRole] : []);
  if (rolesToCheck.length > 0 && !rolesToCheck.includes(userRole ?? "")) {
    return <Navigate to="/" replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
