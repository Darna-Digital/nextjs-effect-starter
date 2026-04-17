import { Effect } from "effect"
import type { OrganizationDependencies } from "../entity/organization.interfaces"
import {
  OrganizationNameReserved,
  OrganizationNameTaken,
} from "../entity/organization.schema"

/**
 * Pure business logic. Takes an already-decoded input (see the schema
 * layer at the edge) and composes domain rules with injected side
 * effects. Return type is inferred — consumers use
 * `ReturnType<typeof createOrganizationFunctions>` if they need to
 * reference it.
 */
export function createOrganizationFunctions(d: OrganizationDependencies) {
  /** Fail if `name` is reserved (compared lower-cased). */
  const assertNotReserved = (name: string) =>
    d.data.reservedNames.has(name.toLowerCase())
      ? Effect.fail(new OrganizationNameReserved({ name }))
      : Effect.void

  /** Fail if another organization already uses `name` (case-insensitive). */
  const assertNameAvailable = (name: string, ignoreId?: string) =>
    Effect.gen(function* () {
      const all = yield* d.sideEffects.getAll()
      const conflict = all.find(
        (o) =>
          o.id !== ignoreId && o.name.toLowerCase() === name.toLowerCase(),
      )
      if (conflict)
        return yield* Effect.fail(new OrganizationNameTaken({ name }))
    })

  return {
    getAll: () =>
      d.sideEffects.getAll().pipe(Effect.withSpan("Organization.getAll")),

    getById: (id: Parameters<typeof d.sideEffects.getById>[0]) =>
      d.sideEffects.getById(id).pipe(
        Effect.withSpan("Organization.getById", {
          attributes: { "organization.id": id },
        }),
      ),

    create: (input: Parameters<typeof d.sideEffects.create>[0]) =>
      Effect.gen(function* () {
        yield* assertNotReserved(input.name)
        yield* assertNameAvailable(input.name)
        return yield* d.sideEffects.create(input)
      }).pipe(
        Effect.withSpan("Organization.create", {
          attributes: { "organization.name": input.name },
        }),
      ),

    update: (
      id: Parameters<typeof d.sideEffects.update>[0],
      input: Parameters<typeof d.sideEffects.update>[1],
    ) =>
      Effect.gen(function* () {
        if (input.name !== undefined) {
          yield* assertNotReserved(input.name)
          yield* assertNameAvailable(input.name, id)
        }
        return yield* d.sideEffects.update(id, input)
      }).pipe(
        Effect.withSpan("Organization.update", {
          attributes: { "organization.id": id },
        }),
      ),

    remove: (id: Parameters<typeof d.sideEffects.remove>[0]) =>
      d.sideEffects.remove(id).pipe(
        Effect.withSpan("Organization.remove", {
          attributes: { "organization.id": id },
        }),
      ),
  }
}

export type OrganizationFunctions = ReturnType<
  typeof createOrganizationFunctions
>
