import { Effect, Ref } from "effect"
import {
  OrganizationNameTaken,
  OrganizationNotFound,
  type Organization,
} from "@/features/organization/schema/organization.schema.model"
import type { OrganizationRepo } from "@/features/organization/repository/organization.repository"

/**
 * In-memory `OrganizationRepository` — `Ref<Organization[]>`. Mirrors the
 * MySQL `UNIQUE` constraint on `name` (case-insensitive) so memory-backed
 * tests exercise the same race-safe create path.
 *
 * `remove` never fails with `OrganizationInUse` here (no FK constraints
 * in a `Ref`); the error type stays in the signature for backend parity.
 */
export const createMemoryOrganizationRepository = (
  seed: readonly Organization[] = [],
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Organization[]>([...seed])

    const repo: OrganizationRepo = {
      list: () => Ref.get(store),

      get: (id) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store)
          const found = items.find((o) => o.id === id)
          if (!found) return yield* Effect.fail(new OrganizationNotFound({ id }))
          return found
        }),

      create: (org) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store)
          if (
            items.some((o) => o.name.toLowerCase() === org.name.toLowerCase())
          ) {
            return yield* Effect.fail(
              new OrganizationNameTaken({ name: org.name }),
            )
          }
          yield* Ref.update(store, (current) => [...current, org])
          return org
        }),

      update: (id, patch) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store)
          const index = items.findIndex((o) => o.id === id)
          if (index === -1)
            return yield* Effect.fail(new OrganizationNotFound({ id }))
          if (
            typeof patch.name === "string" &&
            items.some(
              (o, i) =>
                i !== index &&
                o.name.toLowerCase() === (patch.name as string).toLowerCase(),
            )
          ) {
            return yield* Effect.fail(
              new OrganizationNameTaken({ name: patch.name }),
            )
          }
          const updated = { ...items[index], ...patch } as Organization
          yield* Ref.update(store, (current) => {
            const next = [...current]
            next[index] = updated
            return next
          })
          return updated
        }),

      remove: (id) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store)
          if (!items.some((o) => o.id === id))
            return yield* Effect.fail(new OrganizationNotFound({ id }))
          yield* Ref.update(store, (current) =>
            current.filter((o) => o.id !== id),
          )
        }),
    }

    return repo
  })
