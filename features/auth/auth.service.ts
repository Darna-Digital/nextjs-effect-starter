import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import { Context, Effect } from "effect"
import { SignJWT, jwtVerify } from "jose"
import type { Storage } from "@/lib/effect/layers/storage/storage.base"
import {
  EmailAlreadyTaken,
  InvalidCredentials,
  TokenSigningFailed,
  toPublicUser,
  type PublicUser,
  type UserId,
  type UserRecord,
} from "./auth.model"
import type { Login, Register } from "./auth.requests"

export class UserStorage extends Context.Tag("UserStorage")<
  UserStorage,
  Storage<UserRecord>
>() {}

/** HMAC secret bytes used to sign and verify session JWTs. */
export class JwtSecret extends Context.Tag("JwtSecret")<
  JwtSecret,
  Uint8Array
>() {}

/** How long an issued session token is valid for (jose duration string). */
export class JwtExpiresIn extends Context.Tag("JwtExpiresIn")<
  JwtExpiresIn,
  string
>() {}

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

/**
 * Auth service. Owns user persistence, password hashing, and session JWTs.
 *
 *     yield* Auth.register({ email, password })  // → { user, token }
 *     yield* Auth.login({ email, password })     // → { user, token }
 *     yield* Auth.verifyToken(token)             // → PublicUser
 *
 * The HTTP layer (`apiRoute`) calls `verifyToken` on the cookie to bind
 * `CurrentUser` for the request. Routes that need an authenticated user
 * should use `Auth.requireUser()` (or check `CurrentUser` directly).
 */
export class Auth extends Effect.Service<Auth>()("Auth", {
  accessors: true,
  effect: Effect.gen(function* () {
    const storage = yield* UserStorage
    const secret = yield* JwtSecret
    const expiresIn = yield* JwtExpiresIn

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
          const token = yield* signToken(user)

          yield* Effect.logInfo("User registered").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return { user: toPublicUser(user), token }
        }).pipe(Effect.withSpan("Auth.register")),

      login: (input: Login) =>
        Effect.gen(function* () {
          const user = yield* findByEmail(input.email)
          if (!user) return yield* Effect.fail(new InvalidCredentials())
          if (!verifyPassword(input.password, user.passwordHash))
            return yield* Effect.fail(new InvalidCredentials())

          const token = yield* signToken(user)

          yield* Effect.logInfo("User logged in").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          )

          return { user: toPublicUser(user), token }
        }).pipe(Effect.withSpan("Auth.login")),

      /**
       * Verify a session token. Resolves to the `PublicUser` claims on
       * success, fails with `InvalidCredentials` on any verification
       * error (expired, bad signature, malformed, etc.) — collapsed to
       * one error so the HTTP edge has a single 401 path.
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
