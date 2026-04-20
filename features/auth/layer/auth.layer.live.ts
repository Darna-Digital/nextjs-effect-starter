import { Layer } from "effect"
import { config } from "@/lib/effect/config"
import {
  RefreshTokenRepository,
  UserRepository,
} from "@/features/auth/repository/auth.repository"
import {
  mysqlRefreshTokenRepository,
  mysqlUserRepository,
} from "@/features/auth/repository/auth.repository.mysql"
import { RequestUserResolverLive } from "@/features/auth/auth.http"
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenTtlSeconds,
} from "@/features/auth/service/auth.service"

const encodedSecret = new TextEncoder().encode(config.authSecret)

/** `Auth` backed by MySQL + HS256 JWTs + refresh rotation. */
export const AuthLive = Auth.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(UserRepository, mysqlUserRepository),
      Layer.succeed(RefreshTokenRepository, mysqlRefreshTokenRepository),
      Layer.succeed(JwtSecret, encodedSecret),
      Layer.succeed(JwtExpiresIn, config.accessTokenExpiresIn),
      Layer.succeed(RefreshTokenTtlSeconds, config.refreshTokenTtlSeconds),
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
