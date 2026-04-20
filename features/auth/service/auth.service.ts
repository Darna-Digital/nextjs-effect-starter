import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
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

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN).toString("hex")
  return `${salt}:${derived}`
}

const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const generateRefreshToken = () => randomBytes(32).toString("hex")

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
 * translates those into meaningful domain errors
 * (`InvalidCredentials`, `RefreshTokenExpired`) at the right abstraction
 * layer.
 */
export class Auth extends Effect.Service<Auth>()("Auth", {
  accessors: true,
  effect: Effect.gen(function* () {
    const users = yield* UserRepository
    const refreshTokens = yield* RefreshTokenRepository
    const secret = yield* JwtSecret
    const expiresIn = yield* JwtExpiresIn
    const refreshTtlSeconds = yield* RefreshTokenTtlSeconds

    const signAccessToken = (user: UserRecord) =>
      Effect.tryPromise({
        try: () =>
          new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(secret),
        catch: (cause) => new TokenSigningFailed({ cause }),
      })

    const issueRefreshToken = (userId: UserId) => {
      const token = generateRefreshToken()
      const record: RefreshTokenRecord = {
        id: token,
        userId,
        expiresAt: new Date(
          Date.now() + refreshTtlSeconds * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      }
      return refreshTokens.create(record).pipe(Effect.as(token))
    }

    const issueSession = (user: UserRecord) =>
      Effect.gen(function* () {
        const accessToken = yield* signAccessToken(user)
        const refreshToken = yield* issueRefreshToken(user.id)
        return { user: toPublicUser(user), accessToken, refreshToken }
      })

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
       * The old refresh token is deleted first (rotation). Fails with
       * `RefreshTokenExpired` for unknown, expired, or orphaned tokens.
       */
      refresh: (token: string) =>
        Effect.gen(function* () {
          const record = yield* refreshTokens.get(token)
          if (!record) return yield* Effect.fail(new RefreshTokenExpired())

          if (new Date(record.expiresAt) <= new Date()) {
            yield* refreshTokens.remove(token)
            return yield* Effect.fail(new RefreshTokenExpired())
          }

          yield* refreshTokens.remove(token)

          const user = yield* users.get(record.userId)
          if (!user) return yield* Effect.fail(new RefreshTokenExpired())

          return yield* issueSession(user)
        }).pipe(Effect.withSpan("Auth.refresh")),

      /** Invalidate a session. Idempotent — unknown tokens are ignored. */
      logout: (token: string) =>
        refreshTokens.remove(token).pipe(Effect.withSpan("Auth.logout")),

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
