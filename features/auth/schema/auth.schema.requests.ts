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
