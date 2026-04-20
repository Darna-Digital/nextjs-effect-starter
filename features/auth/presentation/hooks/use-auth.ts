"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Match, Schema as S } from "effect"
import {
  getFetchError,
  type FetcherThrownError,
} from "@darna-digital/composable-fetcher"
import {
  AuthApiErrorSchema,
  AuthSessionSchema,
  LoginSchema,
  RegisterSchema,
  type AuthApiError,
  type AuthSession,
  type Login,
  type Register,
} from "@/features/auth/schema/auth.schema.requests"
import { apiClient } from "../api-client"
import { useAuthContext } from "../auth.context"

const sessionSchema = S.standardSchemaV1(AuthSessionSchema)
const registerSchema = S.standardSchemaV1(RegisterSchema)
const loginSchema = S.standardSchemaV1(LoginSchema)
const authErrorSchema = S.standardSchemaV1(AuthApiErrorSchema)

type AuthThrownError = FetcherThrownError<AuthApiError>

/** Current user from context — no HTTP call. */
export function useCurrentUser() {
  const { user, isLoading } = useAuthContext()
  return { data: user, isLoading }
}

export function useRegister() {
  const { setUser } = useAuthContext()
  return useMutation<AuthSession, AuthThrownError, Register>({
    mutationFn: (input) =>
      apiClient
        .url("/api/auth/register")
        .input(registerSchema)
        .schema(sessionSchema)
        .errorSchema(authErrorSchema)
        .body(input)
        .run("POST") as Promise<AuthSession>,
    onSuccess: ({ user }) => setUser(user),
  })
}

export function useLogin() {
  const { setUser } = useAuthContext()
  return useMutation<AuthSession, AuthThrownError, Login>({
    mutationFn: (input) =>
      apiClient
        .url("/api/auth/login")
        .input(loginSchema)
        .schema(sessionSchema)
        .errorSchema(authErrorSchema)
        .body(input)
        .run("POST") as Promise<AuthSession>,
    onSuccess: ({ user }) => setUser(user),
  })
}

export function useLogout() {
  const { clearUser } = useAuthContext()
  const qc = useQueryClient()
  return useMutation<void, AuthThrownError, void>({
    mutationFn: () =>
      apiClient
        .url("/api/auth/logout")
        .errorSchema(authErrorSchema)
        .run("POST") as Promise<void>,
    onSuccess: () => {
      clearUser()
      qc.clear()
    },
    onError: clearUser,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Error mapping
// ─────────────────────────────────────────────────────────────────────────────

export type AuthFieldError = {
  field: "email" | "password" | null
  message: string
}

const matchApiError = Match.type<AuthApiError>().pipe(
  Match.discriminator("error")("Email already taken", (e) => ({
    field: "email" as const,
    message: `${e.email} is already registered.`,
  })),
  Match.discriminator("error")("Invalid email or password", () => ({
    field: "password" as const,
    message: "Invalid email or password.",
  })),
  Match.discriminator("error")("Not authenticated", () => ({
    field: null,
    message: "You're signed out. Please log in again.",
  })),
  Match.discriminator("error")("Refresh token expired or invalid", () => ({
    field: null,
    message: "Session expired. Please sign in again.",
  })),
  Match.discriminator("error")("Validation failed", () => ({
    field: "email" as const,
    message: "Please check the form fields.",
  })),
  Match.discriminator("error")("Token signing failed", () => ({
    field: null,
    message: "Session could not be created. Please try again.",
  })),
  Match.discriminator("error")("Storage error", () => ({
    field: null,
    message: "Something went wrong on our side. Please try again.",
  })),
  Match.exhaustive,
)

export function parseAuthError(error: unknown): AuthFieldError | null {
  if (!error) return null
  const fe = getFetchError<AuthApiError>(error)
  if (!fe) return { field: null, message: String(error) }
  if (fe.type === "http" && fe.data) return matchApiError(fe.data)
  if (fe.type === "network")
    return { field: null, message: "Network error. Check your connection." }
  return { field: null, message: fe.message }
}
