"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { PublicUser } from "../auth.model"
import { registerUnauthenticatedHandler } from "./api-client"

interface AuthContextValue {
  user: PublicUser | null
  isLoading: boolean
  setUser: (user: PublicUser) => void
  clearUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setUser = useCallback((u: PublicUser) => setUserState(u), [])
  const clearUser = useCallback(() => setUserState(null), [])

  // Let the shared api client notify us when a refresh fails, so context
  // state mirrors the server's (now-cleared) cookies.
  useEffect(() => {
    registerUnauthenticatedHandler(clearUser)
  }, [clearUser])

  // Hydrate on mount: ask the server who we are. The api-client transparently
  // refreshes an expired access token, so this also covers the "cookie is
  // present but JWT expired" case on page reload.
  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          // Try refresh once, then retry /me.
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          })
          if (!refreshRes.ok) return null
          const retry = await fetch("/api/auth/me", { credentials: "include" })
          if (!retry.ok) return null
          return (await retry.json()) as { user: PublicUser }
        }
        return (await res.json()) as { user: PublicUser }
      })
      .then((data) => {
        if (cancelled) return
        if (data?.user) setUserState(data.user)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext: missing AuthProvider")
  return ctx
}
