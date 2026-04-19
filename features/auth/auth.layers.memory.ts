import { Layer } from "effect"
import { createMemoryStorageLayer } from "@/lib/effect/layers/storage/storage.memory"
import type { RefreshTokenRecord, UserRecord } from "./auth.model"
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenStorage,
  RefreshTokenTtlSeconds,
  UserStorage,
} from "./auth.service"

/** Test-only HS256 secret (must be ≥32 bytes). */
const DEFAULT_TEST_SECRET = new TextEncoder().encode(
  "test-secret-test-secret-test-secret-test-secret",
)

/**
 * In-memory `Auth` layer for tests. Each call returns fresh stores.
 *
 *     AuthMemory()
 *     AuthMemory({ seedUsers: [alice] })
 *     AuthMemory({ refreshTtlSeconds: -1 })  // tokens expired-on-create
 */
export const AuthMemory = ({
  seedUsers = [],
  seedRefreshTokens = [],
  secret = DEFAULT_TEST_SECRET,
  accessTtl = "15m",
  refreshTtlSeconds = 7 * 24 * 60 * 60,
}: {
  seedUsers?: readonly UserRecord[]
  seedRefreshTokens?: readonly RefreshTokenRecord[]
  secret?: Uint8Array
  accessTtl?: string
  refreshTtlSeconds?: number
} = {}) =>
  Auth.Default.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(
          UserStorage,
          createMemoryStorageLayer<UserRecord>([...seedUsers]),
        ),
        Layer.effect(
          RefreshTokenStorage,
          createMemoryStorageLayer<RefreshTokenRecord>([...seedRefreshTokens]),
        ),
        Layer.succeed(JwtSecret, secret),
        Layer.succeed(JwtExpiresIn, accessTtl),
        Layer.succeed(RefreshTokenTtlSeconds, refreshTtlSeconds),
      ),
    ),
  )
