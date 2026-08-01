/**
 * Auth state, shared across the whole app via React Context.
 *
 * Deliberately minimal for Phase 1: are we logged in, and a login/logout
 * function. Role-based UI (e.g. hiding Finance screens from a Leasing
 * Officer) can read `useAuth()` later without needing new plumbing --
 * see docs/ROADMAP.md for where that's expected to plug in.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem("access_token")
  );

  async function login(username: string, password: string) {
    const { data } = await apiClient.post("/auth/token/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
