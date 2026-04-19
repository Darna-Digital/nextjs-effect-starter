"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Match, Schema as S } from "effect"
import {
  composableFetcher,
  getFetchError,
  type FetcherThrownError,
} from "@darna-digital/composable-fetcher"
import { PublicUserSchema } from "../../auth.model"
import {
  AuthApiErrorSchema,
  AuthSessionSchema,
  LoginSchema,
  RegisterSchema,
  type AuthApiError,
  type Login,
  type Register,
} from "../../auth.requests"

const ME_KEY = ["auth", "me"] as const

const sessionSchema = S.standardSchemaV1(AuthSessionSchema)
const meSchema = S.standardSchemaV1(S.Struct({ user: PublicUserSchema }))
const registerSchema = S.standardSchemaV1(RegisterSchema)
const loginSchema = S.standardSchemaV1(LoginSchema)
const authErrorSchema = S.standardSchemaV1(AuthApiErrorSchema)

type AuthThrownError = FetcherThrownError<AuthApiError>

/** Current user, or `null` when not authenticated (401 is swallowed to null). */
export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const { user } = await composableFetcher
          .url("/api/auth/me")
          .schema(meSchema)
          .errorSchema(authErrorSchema)
          .run("GET")
        return user
      } catch (error) {
        const fe = getFetchError<AuthApiError>(error)
        if (fe?.type === "http" && fe.status === 401) return null
        throw error
      }
    },
    staleTime: 30_000,
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation<unknown, AuthThrownError, Register>({
    mutationFn: (input) =>
      composableFetcher
        .url("/api/auth/register")
        .input(registerSchema)
        .schema(sessionSchema)
        .errorSchema(authErrorSchema)
        .body(input)
        .run("POST"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation<unknown, AuthThrownError, Login>({
    mutationFn: (input) =>
      composableFetcher
        .url("/api/auth/login")
        .input(loginSchema)
        .schema(sessionSchema)
        .errorSchema(authErrorSchema)
        .body(input)
        .run("POST"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ME_KEY }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation<void, AuthThrownError, void>({
    mutationFn: () =>
      composableFetcher
        .url("/api/auth/logout")
        .errorSchema(authErrorSchema)
        .run("POST"),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null)
      qc.invalidateQueries()
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Error mapping — one branch per union member so adding a new AuthApiError
// variant is a compile-time break here.
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
