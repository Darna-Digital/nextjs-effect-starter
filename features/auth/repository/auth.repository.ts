import { Context, Effect } from "effect"
import { StorageError } from "@/lib/effect/layers/storage"
import type {
  RefreshTokenRecord,
  UserId,
  UserRecord,
} from "@/features/auth/schema/auth.schema.model"

/**
 * Auth storage layer — two repositories with methods shaped for what the
 * auth service actually needs. Returns `null` for not-found rather than a
 * typed error: the auth flows (refresh, login) translate misses into
 * higher-level domain errors like `InvalidCredentials` /
 * `RefreshTokenExpired`, so a low-level "UserNotFound" would just be
 * noise.
 */

export interface UserRepo {
  /** Case-insensitive match on the normalized email. */
  findByEmail: (
    email: string,
  ) => Effect.Effect<UserRecord | null, StorageError>
  get: (id: UserId) => Effect.Effect<UserRecord | null, StorageError>
  create: (user: UserRecord) => Effect.Effect<UserRecord, StorageError>
}

export interface RefreshTokenRepo {
  create: (
    record: RefreshTokenRecord,
  ) => Effect.Effect<RefreshTokenRecord, StorageError>
  get: (
    id: string,
  ) => Effect.Effect<RefreshTokenRecord | null, StorageError>
  /** Idempotent: no error if the id is already gone. */
  remove: (id: string) => Effect.Effect<void, StorageError>
}

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepo
>() {}

export class RefreshTokenRepository extends Context.Tag(
  "RefreshTokenRepository",
)<RefreshTokenRepository, RefreshTokenRepo>() {}
