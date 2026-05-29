import { Schema as S } from "effect";
import { HttpApiSchema } from "@effect/platform";

export const Email = S.Trim.pipe(
  S.lowercased(),
  S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: () => "Must be a valid email address",
  }),
);

export const Password = S.String.pipe(
  S.minLength(8, { message: () => "Password must be at least 8 characters" }),
  S.maxLength(256),
);

export const UserRecordSchema = S.Struct({
  id: S.String,
  email: Email,
  passwordHash: S.String,
  createdAt: S.String,
});
export type UserRecord = typeof UserRecordSchema.Type;

export const PublicUserSchema = S.Struct({
  id: S.String,
  email: Email,
});
export type PublicUser = typeof PublicUserSchema.Type;

export const toPublicUser = (u: UserRecord): PublicUser => ({
  id: u.id,
  email: u.email,
});

export const RefreshTokenRecordSchema = S.Struct({
  id: S.String,
  userId: S.String,
  expiresAt: S.String,
  createdAt: S.String,
});
export type RefreshTokenRecord = typeof RefreshTokenRecordSchema.Type;

export class EmailAlreadyTaken extends S.TaggedError<EmailAlreadyTaken>()(
  "EmailAlreadyTaken",
  { email: S.String },
  HttpApiSchema.annotations({ status: 409 }),
) {}

export class InvalidCredentials extends S.TaggedError<InvalidCredentials>()(
  "InvalidCredentials",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class NotAuthenticated extends S.TaggedError<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class TokenSigningFailed extends S.TaggedError<TokenSigningFailed>()(
  "TokenSigningFailed",
  {},
  HttpApiSchema.annotations({ status: 500 }),
) {}

export class RefreshTokenExpired extends S.TaggedError<RefreshTokenExpired>()(
  "RefreshTokenExpired",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}
