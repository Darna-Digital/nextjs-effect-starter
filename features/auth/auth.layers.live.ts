import { Layer } from "effect"
import { createMysqlStorageLayer } from "@/lib/effect/layers/storage/storage.mysql"
import { db } from "@/lib/db/client"
import { refreshTokens, users } from "@/lib/db/schema"
import type { RefreshTokenRecord, UserRecord } from "./auth.model"
import { RequestUserResolverLive } from "./auth.http"
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenStorage,
  RefreshTokenTtlSeconds,
  UserStorage,
} from "./auth.service"

const secret = process.env.AUTH_SECRET
if (!secret) {
  throw new Error(
    "AUTH_SECRET is not set. Add a long random string to .env.local.",
  )
}

const encodedSecret = new TextEncoder().encode(secret)

/** `Auth` backed by MySQL + HS256 JWTs + refresh rotation. */
export const AuthLive = Auth.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        UserStorage,
        createMysqlStorageLayer<UserRecord>(db, users),
      ),
      Layer.succeed(
        RefreshTokenStorage,
        createMysqlStorageLayer<RefreshTokenRecord>(db, refreshTokens),
      ),
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
 * Full auth stack: `Auth` service + `RequestUserResolver` (cookie strategy).
 *
 * Use this in `AppRuntime`. Swap `RequestUserResolverLive` for a different
 * implementation (e.g. API-key, test stub) without touching anything else.
 */
export const AuthStackLive = Layer.mergeAll(
  AuthLive,
  RequestUserResolverLive.pipe(Layer.provide(AuthLive)),
)
