import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { Context, Effect } from "effect"
import { SignJWT, jwtVerify } from "jose"
import type { Storage } from "@/lib/effect/layers/storage/storage.base"
import { StorageError } from "@/lib/effect/layers/storage/storage.base"
import {
  EmailAlreadyTaken,
  InvalidCredentials,
  RefreshTokenExpired,
  TokenSigningFailed,
  toPublicUser,
  type PublicUser,
  type RefreshTokenId,
  type RefreshTokenRecord,
  type UserId,
  type UserRecord,
} from "./auth.model"
import type { Login, Register } from "./auth.requests"

export class UserStorage extends Context.Tag("UserStorage")<
  UserStorage,
  Storage<UserRecord>
>() {}

/** Storage for refresh tokens — custom interface (not the generic Storage<T>). */
export class RefreshTokenStorage extends Context.Tag("RefreshTokenStorage")<
  RefreshTokenStorage,
  {
    create: (record: RefreshTokenRecord) => Effect.Effect<void, StorageError>
    findByToken: (
      token: string,
    ) => Effect.Effect<RefreshTokenRecord | null, StorageError>
    deleteByToken: (token: string) => Effect.Effect<void, StorageError>
  }
>() {}

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
 */
export class Auth extends Effect.Service<Auth>()("Auth", {
  accessors: true,
  effect: Effect.gen(function* () {
    const storage = yield* UserStorage
    const refreshStorage = yield* RefreshTokenStorage
    const secret = yield* JwtSecret
    const expiresIn = yield* JwtExpiresIn
    const refreshTtlSeconds = yield* RefreshTokenTtlSeconds

    const findByEmail = (email: string) =>
      storage
        .getAll()
        .pipe(
          Effect.map((users) =>
            users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
          ),
        )

    const signToken = (user: UserRecord) =>
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

    const createRefreshToken = (userId: UserId) => {
      const token = generateRefreshToken()
      const record: RefreshTokenRecord = {
        id: crypto.randomUUID() as RefreshTokenId,
        userId,
        token,
        expiresAt: new Date(
          Date.now() + refreshTtlSeconds * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      }
      return refreshStorage.create(record).pipe(Effect.as(token))
    }

    return {
      register: (input: Register) =>
        Effect.gen(function* () {
          const existing = yield* findByEmail(input.email)
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

          yield* storage.create(user)
          const accessToken = yield* signToken(user)
          const refreshToken = yield* createRefreshToken(user.id)

          yield* Effect.logInfo("User registered").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return { user: toPublicUser(user), accessToken, refreshToken }
        }).pipe(Effect.withSpan("Auth.register")),

      login: (input: Login) =>
        Effect.gen(function* () {
          const user = yield* findByEmail(input.email)
          if (!user) return yield* Effect.fail(new InvalidCredentials())
          if (!verifyPassword(input.password, user.passwordHash))
            return yield* Effect.fail(new InvalidCredentials())

          const accessToken = yield* signToken(user)
          const refreshToken = yield* createRefreshToken(user.id)

          yield* Effect.logInfo("User logged in").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return { user: toPublicUser(user), accessToken, refreshToken }
        }).pipe(Effect.withSpan("Auth.login")),

      /**
       * Exchange a valid refresh token for a new access + refresh token pair.
       * The old token is deleted before issuing the new pair (rotation). Fails
       * with `RefreshTokenExpired` if the token is unknown or past its TTL.
       */
      refresh: (token: string) =>
        Effect.gen(function* () {
          const record = yield* refreshStorage.findByToken(token)
          if (!record) return yield* Effect.fail(new RefreshTokenExpired())

          if (new Date(record.expiresAt) <= new Date()) {
            yield* refreshStorage.deleteByToken(token)
            return yield* Effect.fail(new RefreshTokenExpired())
          }

          yield* refreshStorage.deleteByToken(token)

          const userRecord = yield* storage.getById(record.userId).pipe(
            Effect.catchAll(() => Effect.fail(new RefreshTokenExpired())),
          )

          const accessToken = yield* signToken(userRecord)
          const newRefreshToken = yield* createRefreshToken(record.userId)

          return {
            user: toPublicUser(userRecord),
            accessToken,
            refreshToken: newRefreshToken,
          }
        }).pipe(Effect.withSpan("Auth.refresh")),

      /**
       * Invalidate a session by deleting its refresh token. Idempotent —
       * an unknown token is silently ignored.
       */
      logout: (token: string) =>
        refreshStorage
          .deleteByToken(token)
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
