import { describe, expect, it } from "vitest"
import { Effect, Either, Layer } from "effect"
import { scryptSync } from "node:crypto"
import { Auth } from "./auth.service"
import { AuthMemory } from "./auth.layers.memory"
import type {
  RefreshTokenRecord,
  UserId,
  UserRecord,
} from "./auth.model"

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

const run = <A, E>(
  effect: Effect.Effect<A, E, Auth>,
  layer: Layer.Layer<Auth> = AuthMemory(),
) => Effect.runPromise(effect.pipe(Effect.either, Effect.provide(layer)))

const hashPassword = (password: string): string => {
  const salt = "0123456789abcdef0123456789abcdef"
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${derived}`
}

const makeUser = (
  overrides: Partial<UserRecord> = {},
): UserRecord => ({
  id: "user-1" as UserId,
  email: "alice@example.com",
  passwordHash: hashPassword("password123"),
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

const makeRefreshToken = (
  overrides: Partial<RefreshTokenRecord> = {},
): RefreshTokenRecord => ({
  id: "refresh-token-abc",
  userId: "user-1" as UserId,
  expiresAt: "2099-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

// ─────────────────────────────────────────────────────────────────────────────
// register
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth.register", () => {
  it("creates a user and returns access + refresh tokens", async () => {
    const result = await run(
      Auth.register({
        email: "alice@example.com",
        password: "password123",
      }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.user.email).toBe("alice@example.com")
      expect(result.right.user.id).toBeTruthy()
      expect(result.right.accessToken).toMatch(/^eyJ/) // JWT shape
      expect(result.right.refreshToken).toMatch(/^[0-9a-f]{64}$/) // 32 hex bytes
    }
  })

  it("rejects a duplicate email (case-insensitive)", async () => {
    const existing = makeUser({ email: "alice@example.com" })
    const result = await run(
      Auth.register({
        email: "ALICE@example.com",
        password: "password123",
      }),
      AuthMemory({ seedUsers: [existing] }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("EmailAlreadyTaken")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// login
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth.login", () => {
  const alice = makeUser({
    id: "alice" as UserId,
    email: "alice@example.com",
    passwordHash: hashPassword("correct-horse-battery"),
  })

  it("returns tokens when credentials match", async () => {
    const result = await run(
      Auth.login({
        email: "alice@example.com",
        password: "correct-horse-battery",
      }),
      AuthMemory({ seedUsers: [alice] }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.user.id).toBe("alice")
      expect(result.right.accessToken).toBeTruthy()
      expect(result.right.refreshToken).toBeTruthy()
    }
  })

  it("fails with InvalidCredentials for wrong password", async () => {
    const result = await run(
      Auth.login({
        email: "alice@example.com",
        password: "wrong-password",
      }),
      AuthMemory({ seedUsers: [alice] }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("InvalidCredentials")
  })

  it("fails with InvalidCredentials for unknown email", async () => {
    const result = await run(
      Auth.login({
        email: "ghost@example.com",
        password: "password123",
      }),
      AuthMemory({ seedUsers: [alice] }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("InvalidCredentials")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// verifyToken
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth.verifyToken", () => {
  it("returns the public user for a freshly-signed token", async () => {
    const result = await run(
      Effect.gen(function* () {
        const session = yield* Auth.register({
          email: "bob@example.com",
          password: "password123",
        })
        return yield* Auth.verifyToken(session.accessToken)
      }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result))
      expect(result.right.email).toBe("bob@example.com")
  })

  it("fails with InvalidCredentials for a garbage token", async () => {
    const result = await run(Auth.verifyToken("not.a.jwt"))
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("InvalidCredentials")
  })

  it("fails with InvalidCredentials when signed by a different secret", async () => {
    const program = Effect.gen(function* () {
      const session = yield* Auth.register({
        email: "carol@example.com",
        password: "password123",
      })
      return session.accessToken
    })
    // Sign under secret A
    const signed = await Effect.runPromise(
      program.pipe(Effect.provide(AuthMemory())),
    )
    // Verify under secret B
    const otherSecret = new TextEncoder().encode(
      "different-secret-different-secret-different!",
    )
    const result = await run(
      Auth.verifyToken(signed),
      AuthMemory({ secret: otherSecret }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("InvalidCredentials")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// refresh
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth.refresh", () => {
  it("rotates tokens: old refresh is invalidated, new access + refresh returned", async () => {
    const result = await run(
      Effect.gen(function* () {
        const first = yield* Auth.register({
          email: "dan@example.com",
          password: "password123",
        })
        const second = yield* Auth.refresh(first.refreshToken)
        // Old refresh must no longer work (rotation)
        const third = yield* Effect.either(Auth.refresh(first.refreshToken))
        return { first, second, third }
      }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      const { first, second, third } = result.right
      expect(second.refreshToken).not.toBe(first.refreshToken)
      expect(second.accessToken).toBeTruthy()
      expect(second.user.email).toBe("dan@example.com")
      expect(Either.isLeft(third)).toBe(true)
      if (Either.isLeft(third))
        expect(third.left._tag).toBe("RefreshTokenExpired")
    }
  })

  it("fails with RefreshTokenExpired for an unknown token", async () => {
    const result = await run(Auth.refresh("no-such-token"))
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("RefreshTokenExpired")
  })

  it("fails + deletes the token when it is past its TTL", async () => {
    const user = makeUser({ id: "user-42" as UserId })
    const stale = makeRefreshToken({
      id: "stale-token",
      userId: user.id,
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
    const result = await run(
      Effect.gen(function* () {
        const first = yield* Effect.either(Auth.refresh("stale-token"))
        // Even with a "correct" TTL layer, the token is now gone.
        const second = yield* Effect.either(Auth.refresh("stale-token"))
        return { first, second }
      }),
      AuthMemory({ seedUsers: [user], seedRefreshTokens: [stale] }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      const { first, second } = result.right
      expect(Either.isLeft(first)).toBe(true)
      if (Either.isLeft(first))
        expect(first.left._tag).toBe("RefreshTokenExpired")
      expect(Either.isLeft(second)).toBe(true)
      if (Either.isLeft(second))
        expect(second.left._tag).toBe("RefreshTokenExpired")
    }
  })

  it("fails when the user behind the refresh token no longer exists", async () => {
    const orphan = makeRefreshToken({
      id: "orphan-token",
      userId: "ghost" as UserId,
    })
    const result = await run(
      Auth.refresh("orphan-token"),
      AuthMemory({ seedRefreshTokens: [orphan] }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("RefreshTokenExpired")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// logout
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth.logout", () => {
  it("invalidates the refresh token so it can't be reused", async () => {
    const result = await run(
      Effect.gen(function* () {
        const session = yield* Auth.register({
          email: "eve@example.com",
          password: "password123",
        })
        yield* Auth.logout(session.refreshToken)
        return yield* Effect.either(Auth.refresh(session.refreshToken))
      }),
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(Either.isLeft(result.right)).toBe(true)
      if (Either.isLeft(result.right))
        expect(result.right.left._tag).toBe("RefreshTokenExpired")
    }
  })

  it("is idempotent for unknown tokens", async () => {
    const result = await run(Auth.logout("never-existed"))
    expect(Either.isRight(result)).toBe(true)
  })
})
