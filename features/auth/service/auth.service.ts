import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { Context, Effect } from "effect"
import { SignJWT, jwtVerify } from "jose"
import {
  RefreshTokenRepository,
  UserRepository,
} from "@/features/auth/repository/auth.repository"
import {
  EmailAlreadyTaken,
  InvalidCredentials,
  RefreshTokenExpired,
  TokenSigningFailed,
  toPublicUser,
  type PublicUser,
  type RefreshTokenRecord,
  type UserId,
  type UserRecord,
} from "@/features/auth/schema/auth.schema.model"
import type { Login, Register } from "@/features/auth/schema/auth.schema.requests"

/** HMAC secret bytes used to sign and verify access JWTs. */
export class JwtSecret extends Context.Tag("JwtSecret")<
  JwtSecret,
  Uint8Array
>() {}

/** How long an issued access token is valid (jose duration string). */
export class JwtExpiresIn extends Context.Tag("JwtExpiresIn")<
  JwtExpiresIn,
  string
>() {}

/** How long a refresh token is valid in seconds. */
export class RefreshTokenTtlSeconds extends Context.Tag(
  "RefreshTokenTtlSeconds",
)<RefreshTokenTtlSeconds, number>() {}

// ─────────────────────────────────────────────────────────────────────────────
// Password hashing — node:crypto scrypt, no extra deps. Format: "salt:hash"
// where both halves are hex. `timingSafeEqual` guards verify against timing
// side-channels.
// ─────────────────────────────────────────────────────────────────────────────

const SCRYPT_KEY_LEN = 64

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN).toString("hex")
  return `${salt}:${derived}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh-token helpers
//
// The raw token is 32 random bytes (64 hex chars). Only the sha256 digest
// is stored; a DB dump can't hijack active sessions. No salt needed —
// 256 bits of random entropy already rules out rainbow tables.
// ─────────────────────────────────────────────────────────────────────────────

function generateRefreshToken() {
  return randomBytes(32).toString("hex")
}

function hashRefreshToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex")
}

/**
 * Auth service. Owns user persistence, password hashing, JWTs, and refresh
 * token rotation.
 *
 *     yield* Auth.register({ email, password })  // → { user, accessToken, refreshToken }
 *     yield* Auth.login({ email, password })     // → { user, accessToken, refreshToken }
 *     yield* Auth.refresh(refreshToken)          // → { user, accessToken, refreshToken }
 *     yield* Auth.logout(refreshToken)           // → void
 *     yield* Auth.verifyToken(accessToken)       // → PublicUser
 *
 * The repositories return `null` for not-found cases; this service
 * translates those into domain errors (`InvalidCredentials`,
 * `RefreshTokenExpired`) at the right abstraction layer.
 */
export class Auth extends Effect.Service<Auth>()("Auth", {
  accessors: true,
  effect: Effect.gen(function* () {
    const users = yield* UserRepository
    const refreshTokens = yield* RefreshTokenRepository
    const secret = yield* JwtSecret
    const expiresIn = yield* JwtExpiresIn
    const refreshTtlSeconds = yield* RefreshTokenTtlSeconds

    function signAccessToken(user: UserRecord) {
      return Effect.tryPromise({
        try: () =>
          new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(secret),
        catch: (cause) => new TokenSigningFailed({ cause }),
      })
    }

    /** Build a fresh refresh-token record. Returns the raw token (for the
     *  cookie) and the record (id = sha256(raw); never stored in plain). */
    function mintRefreshToken(userId: UserId) {
      const raw = generateRefreshToken()
      const record: RefreshTokenRecord = {
        id: hashRefreshToken(raw),
        userId,
        expiresAt: new Date(
          Date.now() + refreshTtlSeconds * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      }
      return { raw, record }
    }

    function issueSession(user: UserRecord) {
      return Effect.gen(function* () {
        const accessToken = yield* signAccessToken(user)
        const { raw, record } = mintRefreshToken(user.id)
        yield* refreshTokens.create(record)
        return { user: toPublicUser(user), accessToken, refreshToken: raw }
      })
    }

    return {
      register: (input: Register) =>
        Effect.gen(function* () {
          const existing = yield* users.findByEmail(input.email)
          if (existing)
            return yield* Effect.fail(
              new EmailAlreadyTaken({ email: input.email }),
            )

          const user: UserRecord = {
            id: crypto.randomUUID() as UserId,
            email: input.email,
            passwordHash: hashPassword(input.password),
            createdAt: new Date().toISOString(),
          }

          yield* users.create(user)
          const session = yield* issueSession(user)

          yield* Effect.logInfo("User registered").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return session
        }).pipe(Effect.withSpan("Auth.register")),

      login: (input: Login) =>
        Effect.gen(function* () {
          const user = yield* users.findByEmail(input.email)
          if (!user) return yield* Effect.fail(new InvalidCredentials())
          if (!verifyPassword(input.password, user.passwordHash))
            return yield* Effect.fail(new InvalidCredentials())

          const session = yield* issueSession(user)

          yield* Effect.logInfo("User logged in").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return session
        }).pipe(Effect.withSpan("Auth.login")),

      /**
       * Exchange a valid refresh token for a new access + refresh pair.
       *
       * Concurrency-safe rotation: the repository's `rotate` does an
       * INSERT + DELETE in a single transaction, and fails with
       * `RefreshTokenExpired` if the old row is gone (someone else
       * already refreshed). Fails the same way for unknown, expired, or
       * orphaned tokens.
       */
      refresh: (rawToken: string) =>
        Effect.gen(function* () {
          const oldId = hashRefreshToken(rawToken)

          const record = yield* refreshTokens.get(oldId)
          if (!record) return yield* Effect.fail(new RefreshTokenExpired())

          if (new Date(record.expiresAt) <= new Date()) {
            yield* refreshTokens.remove(oldId)
            return yield* Effect.fail(new RefreshTokenExpired())
          }

          const user = yield* users.get(record.userId)
          if (!user) {
            yield* refreshTokens.remove(oldId)
            return yield* Effect.fail(new RefreshTokenExpired())
          }

          const accessToken = yield* signAccessToken(user)
          const { raw: newRaw, record: newRecord } = mintRefreshToken(user.id)

          yield* refreshTokens.rotate(oldId, newRecord)

          return {
            user: toPublicUser(user),
            accessToken,
            refreshToken: newRaw,
          }
        }).pipe(Effect.withSpan("Auth.refresh")),

      /** Invalidate a session. Idempotent — unknown tokens are ignored. */
      logout: (rawToken: string) =>
        refreshTokens
          .remove(hashRefreshToken(rawToken))
          .pipe(Effect.withSpan("Auth.logout")),

      /**
       * Verify an access token. Returns `PublicUser` claims on success,
       * fails with `InvalidCredentials` on any verification error.
       */
      verifyToken: (token: string) =>
        Effect.tryPromise({
          try: async () => {
            const { payload } = await jwtVerify(token, secret)
            return {
              id: payload.sub as UserId,
              email: payload.email as string,
            } satisfies PublicUser
          },
          catch: () => new InvalidCredentials(),
        }).pipe(Effect.withSpan("Auth.verifyToken")),
    }
  }),
}) {}
