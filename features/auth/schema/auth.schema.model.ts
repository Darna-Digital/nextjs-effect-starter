import { Data, Schema as S } from "effect";


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

export class EmailAlreadyTaken extends Data.TaggedError("EmailAlreadyTaken")<{
  readonly email: string;
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Email already taken", email: this.email },
      { status: 409 },
    );
  }
}

export class InvalidCredentials extends Data.TaggedError("InvalidCredentials") {
  toResponse(): Response {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
}

export class NotAuthenticated extends Data.TaggedError("NotAuthenticated") {
  toResponse(): Response {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
}

export class TokenSigningFailed extends Data.TaggedError("TokenSigningFailed")<{
  readonly cause: unknown;
}> {
  toResponse(): Response {
    console.error("TokenSigningFailed", this.cause);
    return Response.json({ error: "Token signing failed" }, { status: 500 });
  }
}

export class RefreshTokenExpired extends Data.TaggedError(
  "RefreshTokenExpired",
) {
  toResponse(): Response {
    return Response.json(
      { error: "Refresh token expired or invalid" },
      { status: 401 },
    );
  }
}
