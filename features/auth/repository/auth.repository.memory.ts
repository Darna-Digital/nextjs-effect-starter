import { Effect, Ref } from "effect"
import type {
  RefreshTokenRecord,
  UserRecord,
} from "@/features/auth/schema/auth.schema.model"
import type {
  RefreshTokenRepo,
  UserRepo,
} from "@/features/auth/repository/auth.repository"

export const createMemoryUserRepository = (
  seed: readonly UserRecord[] = [],
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<UserRecord[]>([...seed])

    const repo: UserRepo = {
      findByEmail: (email) =>
        Ref.get(store).pipe(
          Effect.map(
            (items) =>
              items.find(
                (u) => u.email.toLowerCase() === email.toLowerCase(),
              ) ?? null,
          ),
        ),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.map((items) => items.find((u) => u.id === id) ?? null),
        ),

      create: (user) =>
        Ref.update(store, (items) => [...items, user]).pipe(Effect.as(user)),
    }

    return repo
  })

export const createMemoryRefreshTokenRepository = (
  seed: readonly RefreshTokenRecord[] = [],
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<RefreshTokenRecord[]>([...seed])

    const repo: RefreshTokenRepo = {
      create: (record) =>
        Ref.update(store, (items) => [...items, record]).pipe(
          Effect.as(record),
        ),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.map((items) => items.find((r) => r.id === id) ?? null),
        ),

      remove: (id) =>
        Ref.update(store, (items) => items.filter((r) => r.id !== id)).pipe(
          Effect.asVoid,
        ),
    }

    return repo
  })
