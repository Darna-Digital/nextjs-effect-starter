import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { TooManyRequests } from "@/lib/effect/layers/rate-limit";
import { StorageError } from "@/lib/effect/layers/storage";
import { Authentication } from "@/features/auth/http/auth.middleware";
import {
  EmailAlreadyTaken,
  InvalidCredentials,
  RefreshTokenExpired,
  TokenSigningFailed,
} from "@/features/auth/schema/auth.schema.model";
import {
  AuthSessionSchema,
  LoginSchema,
  RegisterSchema,
} from "@/features/auth/schema/auth.schema.requests";

export class AuthApi extends HttpApiGroup.make("auth")
  .add(
    HttpApiEndpoint.post("register", "/auth/register")
      .setPayload(RegisterSchema)
      .addSuccess(AuthSessionSchema, { status: 201 })
      .addError(EmailAlreadyTaken)
      .addError(TokenSigningFailed)
      .addError(TooManyRequests)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.post("login", "/auth/login")
      .setPayload(LoginSchema)
      .addSuccess(AuthSessionSchema)
      .addError(InvalidCredentials)
      .addError(TokenSigningFailed)
      .addError(TooManyRequests)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.post("refresh", "/auth/refresh")
      .addSuccess(AuthSessionSchema)
      .addError(RefreshTokenExpired)
      .addError(TokenSigningFailed)
      .addError(TooManyRequests)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.post("logout", "/auth/logout")
      .addSuccess(HttpApiSchema.NoContent)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.get("me", "/auth/me")
      .addSuccess(AuthSessionSchema)
      .middleware(Authentication),
  ) {}
