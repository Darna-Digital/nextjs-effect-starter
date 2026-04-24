import { Layer } from "effect";
import {
  RefreshTokenRepository,
  UserRepository,
} from "@/features/auth/repository/auth.repository";
import {
  createMemoryRefreshTokenRepository,
  createMemoryUserRepository,
} from "@/features/auth/repository/auth.repository.memory";
import type {
  RefreshTokenRecord,
  UserRecord,
} from "@/features/auth/schema/auth.schema.model";
import {
  Auth,
  JwtExpiresIn,
  JwtSecret,
  RefreshTokenTtlSeconds,
} from "@/features/auth/service/auth.service";

const DEFAULT_TEST_SECRET = new TextEncoder().encode(
  "test-secret-test-secret-test-secret-test-secret",
);

export const AuthMemory = ({
  seedUsers = [],
  seedRefreshTokens = [],
  secret = DEFAULT_TEST_SECRET,
  accessTtl = "15m",
  refreshTtlSeconds = 7 * 24 * 60 * 60,
}: {
  seedUsers?: readonly UserRecord[];
  seedRefreshTokens?: readonly RefreshTokenRecord[];
  secret?: Uint8Array;
  accessTtl?: string;
  refreshTtlSeconds?: number;
} = {}) =>
  Auth.Default.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(UserRepository, createMemoryUserRepository(seedUsers)),
        Layer.effect(
          RefreshTokenRepository,
          createMemoryRefreshTokenRepository(seedRefreshTokens),
        ),
        Layer.succeed(JwtSecret, secret),
        Layer.succeed(JwtExpiresIn, accessTtl),
        Layer.succeed(RefreshTokenTtlSeconds, refreshTtlSeconds),
      ),
    ),
  );
