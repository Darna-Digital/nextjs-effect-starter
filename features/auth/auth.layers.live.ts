import { Effect, Layer } from "effect"
import { eq } from "drizzle-orm"
import { createMysqlStorageLayer } from "@/lib/effect/layers/storage/storage.mysql"
import { StorageError } from "@/lib/effect/layers/storage/storage.base"
import { db } from "@/lib/db/client"
import { refreshTokens, users } from "@/lib/db/schema"
import type { RefreshTokenRecord, UserRecord } from "./auth.model"
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenStorage,
  RefreshTokenTtlSeconds,
  UserStorage,
} from "./auth.service"
import { RequestUserResolverLive } from "./auth.middleware"

const secret = process.env.AUTH_SECRET
if (!secret) {
  throw new Error(
    "AUTH_SECRET is not set. Add a long random string to .env.local.",
  )
}

const encodedSecret = new TextEncoder().encode(secret)

// ─────────────────────────────────────────────────────────────────────────────
// RefreshTokenStorage — MySQL implementation
// ─────────────────────────────────────────────────────────────────────────────

const mysqlRefreshTokenStorage = {
  create: (record: RefreshTokenRecord) =>
    Effect.tryPromise({
      try: () => db.insert(refreshTokens).values(record),
      catch: (cause) => new StorageError({ cause }),
    }).pipe(Effect.asVoid),

  findByToken: (token: string) =>
    Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(refreshTokens)
          .where(eq(refreshTokens.token, token))
          .limit(1),
      catch: (cause) => new StorageError({ cause }),
    }).pipe(
      Effect.map((rows) =>
        rows.length > 0 ? (rows[0] as RefreshTokenRecord) : null,
      ),
    ),

  deleteByToken: (token: string) =>
    Effect.tryPromise({
      try: () =>
        db.delete(refreshTokens).where(eq(refreshTokens.token, token)),
      catch: (cause) => new StorageError({ cause }),
    }).pipe(Effect.asVoid),
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthLive — wires all tags and provides Auth service
// ─────────────────────────────────────────────────────────────────────────────

/** Layer that provides `Auth` backed by MySQL + HS256 JWTs + refresh rotation. */
export const AuthLive = Auth.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        UserStorage,
        createMysqlStorageLayer<UserRecord>(db, users),
      ),
      Layer.succeed(RefreshTokenStorage, mysqlRefreshTokenStorage),
      Layer.succeed(JwtSecret, encodedSecret),
      Layer.succeed(
        JwtExpiresIn,
        process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN ?? "15m",
      ),
      Layer.succeed(
        RefreshTokenTtlSeconds,
        Number(process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60),
      ),
    ),
  ),
)

/**
 * Full auth stack: `Auth` service + `RequestUserResolver` (bearer strategy).
 *
 * Use this in `AppRuntime`. Swap `RequestUserResolverLive` for a different
 * implementation (e.g. API-key, test stub) without touching anything else.
 */
export const AuthStackLive = Layer.mergeAll(
  AuthLive,
  RequestUserResolverLive.pipe(Layer.provide(AuthLive)),
)
