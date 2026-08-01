/**
 * Route guard: redirects to /login if there's no active session.
 * Wrap any page that needs auth with this instead of checking
 * `isAuthenticated` inside every page component individually.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
