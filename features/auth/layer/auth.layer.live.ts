import { Layer } from "effect"
import {
  RefreshTokenRepository,
  UserRepository,
} from "@/features/auth/repository/auth.repository"
import {
  createRefreshTokenRepository,
  createDbUserRepository,
} from "@/features/auth/repository/auth.repository.db"
import { RequestUserResolverLive } from "@/features/auth/auth.http"
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenTtlSeconds,
} from "@/features/auth/service/auth.service"

const secret = process.env.AUTH_SECRET
if (!secret) {
  throw new Error(
    "AUTH_SECRET is not set. Add a long random string to .env.local.",
  )
}

const encodedSecret = new TextEncoder().encode(secret)

// HS256 keys shorter than 32 bytes are effectively guessable.
// Fail loudly at boot rather than silently accepting a weak secret.
if (encodedSecret.byteLength < 32) {
  throw new Error(
    `AUTH_SECRET must be at least 32 bytes (got ${encodedSecret.byteLength}). ` +
      `Generate one with:  openssl rand -hex 32`,
  )
}

/** `Auth` backed by MySQL + HS256 JWTs + refresh rotation. */
export const AuthLive = Auth.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(UserRepository, createDbUserRepository),
      Layer.succeed(RefreshTokenRepository, createRefreshTokenRepository),
      Layer.succeed(JwtSecret, encodedSecret),
      Layer.succeed(
        JwtExpiresIn,
        process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN ?? "15m",
      ),
      Layer.succeed(
        RefreshTokenTtlSeconds,
        Number(
          process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60,
        ),
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
