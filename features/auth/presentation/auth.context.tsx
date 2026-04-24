"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { Schema as S } from "effect"
import { PublicUserSchema, type PublicUser } from "@/features/auth/schema/auth.schema.model"
import { apiClient, registerUnauthenticatedHandler } from "./api-client"

const meSchema = S.standardSchemaV1(S.Struct({ user: PublicUserSchema }))

type AuthContextValue = {
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

  // Hydrate on mount: ask the server who we are. `apiClient`'s catch handler
  // transparently refreshes an expired access token, so a single call covers
  // all three cases: fresh cookie, expired JWT + valid refresh, or logged out.
  useEffect(() => {
    let cancelled = false
    apiClient
      .url("/api/auth/me")
      .schema(meSchema)
      .run("GET")
      .then((data) => {
        if (cancelled) return
        if (data?.user) setUserState(data.user)
      })
      .catch(() => {
        // Refresh already cleared cookies and called onUnauthenticated.
      })
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
