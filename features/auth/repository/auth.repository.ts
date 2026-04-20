import { Context, Effect } from "effect"
import { StorageError } from "@/lib/effect/layers/storage"
import {
  RefreshTokenExpired,
  type RefreshTokenRecord,
  type UserId,
  type UserRecord,
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
  /**
   * Atomic rotate: delete `oldId` and insert `newRecord` in a single
   * transaction. Fails with `RefreshTokenExpired` if `oldId` is already
   * gone — that's the reuse-detection signal for concurrent refreshes or
   * stolen tokens.
   */
  rotate: (
    oldId: string,
    newRecord: RefreshTokenRecord,
  ) => Effect.Effect<void, RefreshTokenExpired | StorageError>
}

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepo
>() {}

export class RefreshTokenRepository extends Context.Tag(
  "RefreshTokenRepository",
)<RefreshTokenRepository, RefreshTokenRepo>() {}
