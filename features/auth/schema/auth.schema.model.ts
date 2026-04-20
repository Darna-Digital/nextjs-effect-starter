import { Data, Schema as S } from "effect"

export const UserId = S.String.pipe(S.brand("UserId"))
export type UserId = typeof UserId.Type

/** Email after trim + lowercase, validated by Effect's email pattern. */
export const Email = S.Trim.pipe(
  S.lowercased(),
  S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: () => "Must be a valid email address",
  }),
)

/** Plaintext password — only used at the request boundary, never stored. */
export const Password = S.String.pipe(
  S.minLength(8, { message: () => "Password must be at least 8 characters" }),
  S.maxLength(256),
)

/**
 * Persisted user row. The `passwordHash` field never crosses the HTTP
 * boundary — the wire shape is `PublicUser` below.
 */
export const UserRecordSchema = S.Struct({
  id: UserId,
  email: Email,
  passwordHash: S.String,
  createdAt: S.String,
})
export type UserRecord = typeof UserRecordSchema.Type

/** What the client sees: id + email, no secrets. */
export const PublicUserSchema = S.Struct({
  id: UserId,
  email: Email,
})
export type PublicUser = typeof PublicUserSchema.Type

export const toPublicUser = (u: UserRecord): PublicUser => ({
  id: u.id,
  email: u.email,
})

/**
 * Persisted refresh-token row. `id` stores the **sha256 hash** of the
 * secret token — the raw token only exists in the client's cookie and in
 * flight during rotation. If the DB is ever dumped, no session can be
 * hijacked from it.
 */
export const RefreshTokenRecordSchema = S.Struct({
  id: S.String,
  userId: UserId,
  expiresAt: S.String,
  createdAt: S.String,
})
export type RefreshTokenRecord = typeof RefreshTokenRecordSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Domain errors
// ─────────────────────────────────────────────────────────────────────────────

export class EmailAlreadyTaken extends Data.TaggedError("EmailAlreadyTaken")<{
  readonly email: string
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Email already taken", email: this.email },
      { status: 409 },
    )
  }
}

export class InvalidCredentials extends Data.TaggedError("InvalidCredentials") {
  toResponse(): Response {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
    )
  }
}

export class NotAuthenticated extends Data.TaggedError("NotAuthenticated") {
  toResponse(): Response {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }
}

export class TokenSigningFailed extends Data.TaggedError("TokenSigningFailed")<{
  readonly cause: unknown
}> {
  toResponse(): Response {
    console.error("TokenSigningFailed", this.cause)
    return Response.json({ error: "Token signing failed" }, { status: 500 })
  }
}

export class RefreshTokenExpired extends Data.TaggedError(
  "RefreshTokenExpired",
) {
  toResponse(): Response {
    return Response.json(
      { error: "Refresh token expired or invalid" },
      { status: 401 },
    )
  }
}
