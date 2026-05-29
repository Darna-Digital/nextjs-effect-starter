"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type PublicUser } from "@/features/auth/schema/auth.schema.model";
import { fetchClient, registerUnauthenticatedHandler } from "@/lib/api/client";

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  setUser: (user: PublicUser) => void;
  clearUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((u: PublicUser) => setUserState(u), []);
  const clearUser = useCallback(() => setUserState(null), []);

  useEffect(() => {
    registerUnauthenticatedHandler(clearUser);
  }, [clearUser]);

  useEffect(() => {
    let cancelled = false;
    fetchClient
      .GET("/api/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.user) setUserState(data.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext: missing AuthProvider");
  return ctx;
}
