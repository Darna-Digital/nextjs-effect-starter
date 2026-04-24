import { Schema as S } from "effect";
import {
  Email,
  Password,
  PublicUserSchema,
} from "@/features/auth/schema/auth.schema.model";

export const RegisterSchema = S.Struct({
  email: Email,
  password: Password,
});
export type Register = typeof RegisterSchema.Type;

export const LoginSchema = S.Struct({
  email: Email,
  password: Password,
});
export type Login = typeof LoginSchema.Type;

export const AuthSessionSchema = S.Struct({
  user: PublicUserSchema,
});
export type AuthSession = typeof AuthSessionSchema.Type;

export const AuthApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Email already taken"), email: S.String }),
  S.Struct({ error: S.Literal("Invalid email or password") }),
  S.Struct({ error: S.Literal("Not authenticated") }),
  S.Struct({ error: S.Literal("Refresh token expired or invalid") }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Too many requests"), retryAfter: S.Number }),
  S.Struct({ error: S.Literal("Token signing failed") }),
  S.Struct({ error: S.Literal("Storage error") }),
);
export type AuthApiError = typeof AuthApiErrorSchema.Type;
