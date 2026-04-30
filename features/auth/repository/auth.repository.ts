import { Context, Effect } from "effect";
import { StorageError } from "@/lib/effect/layers/storage";
import {
  RefreshTokenExpired,
  type RefreshTokenRecord,
  type UserRecord,
} from "@/features/auth/schema/auth.schema.model";

export interface UserRepo {
  findByEmail: (
    email: string,
  ) => Effect.Effect<UserRecord | null, StorageError>;
  get: (id: string) => Effect.Effect<UserRecord | null, StorageError>;
  create: (user: UserRecord) => Effect.Effect<UserRecord, StorageError>;
}

export interface RefreshTokenRepo {
  create: (
    record: RefreshTokenRecord,
  ) => Effect.Effect<RefreshTokenRecord, StorageError>;
  get: (id: string) => Effect.Effect<RefreshTokenRecord | null, StorageError>;
  remove: (id: string) => Effect.Effect<void, StorageError>;
  rotate: (
    oldId: string,
    newRecord: RefreshTokenRecord,
  ) => Effect.Effect<void, RefreshTokenExpired | StorageError>;
}

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepo
>() {}

export class RefreshTokenRepository extends Context.Tag(
  "RefreshTokenRepository",
)<RefreshTokenRepository, RefreshTokenRepo>() {}
