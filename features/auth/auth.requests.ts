import { Schema as S } from "effect"
import { Email, Password, PublicUserSchema } from "./auth.model"

// ─────────────────────────────────────────────────────────────────────────────
// Inputs — request payloads decoded at the HTTP edge
// ─────────────────────────────────────────────────────────────────────────────

export const RegisterSchema = S.Struct({
  email: Email,
  password: Password,
})
export type Register = typeof RegisterSchema.Type

export const LoginSchema = S.Struct({
  email: Email,
  password: Password,
})
export type Login = typeof LoginSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Outputs — tokens live in httpOnly cookies; only the public user crosses
// the wire to the browser.
// ─────────────────────────────────────────────────────────────────────────────

export const AuthSessionSchema = S.Struct({
  user: PublicUserSchema,
})
export type AuthSession = typeof AuthSessionSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Wire error shape — typed discriminated union for the client
// ─────────────────────────────────────────────────────────────────────────────

export const AuthApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Email already taken"), email: S.String }),
  S.Struct({ error: S.Literal("Invalid email or password") }),
  S.Struct({ error: S.Literal("Not authenticated") }),
  S.Struct({ error: S.Literal("Refresh token expired or invalid") }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Token signing failed"), cause: S.String }),
  S.Struct({ error: S.Literal("Storage error"), cause: S.String }),
)
export type AuthApiError = typeof AuthApiErrorSchema.Type
