import { Effect, Ref } from "effect"
import {
  OrganizationNotFound,
  type Organization,
} from "@/features/organization/schema/organization.schema.model"
import type { OrganizationRepo } from "@/features/organization/repository/organization.repository"

/**
 * In-memory `OrganizationRepository` — `Ref<Organization[]>`. Note that
 * `remove` here can never fail with `OrganizationInUse` (no FK constraints
 * in a `Ref`); the error type stays in the signature so the service's
 * exhaustive match is portable across backends.
 */
export const createMemoryOrganizationRepository = (
  seed: readonly Organization[] = [],
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Organization[]>([...seed])

    const repo: OrganizationRepo = {
      list: () => Ref.get(store),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const found = items.find((o) => o.id === id)
            return found
              ? Effect.succeed(found)
              : Effect.fail(new OrganizationNotFound({ id }))
          }),
        ),

      create: (org) =>
        Ref.update(store, (items) => [...items, org]).pipe(Effect.as(org)),

      update: (id, patch) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const index = items.findIndex((o) => o.id === id)
            if (index === -1)
              return Effect.fail(new OrganizationNotFound({ id }))
            const updated = { ...items[index], ...patch } as Organization
            return Ref.update(store, (current) => {
              const next = [...current]
              next[index] = updated
              return next
            }).pipe(Effect.as(updated))
          }),
        ),

      remove: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            if (!items.some((o) => o.id === id))
              return Effect.fail(new OrganizationNotFound({ id }))
            return Ref.update(store, (current) =>
              current.filter((o) => o.id !== id),
            )
          }),
        ),
    }

    return repo
  })
