import { Effect } from "effect"
import type {
  OrganizationDependencies,
  OrganizationFunctions,
} from "../entity/organization.interfaces"
import {
  OrganizationNameReserved,
  OrganizationNameTaken,
} from "../entity/organization.schema"

export function createOrganizationFunctions(
  d: OrganizationDependencies,
): OrganizationFunctions {
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

    getById: (id) =>
      d.sideEffects
        .getById(id)
        .pipe(Effect.withSpan("Organization.getById", { attributes: { id } })),

    create: (input) =>
      Effect.gen(function* () {
        yield* assertNotReserved(input.name)
        yield* assertNameAvailable(input.name)
        return yield* d.sideEffects.create(input)
      }).pipe(
        Effect.withSpan("Organization.create", {
          attributes: { name: input.name },
        }),
      ),

    update: (id, input) =>
      Effect.gen(function* () {
        if (input.name !== undefined) {
          yield* assertNotReserved(input.name)
          yield* assertNameAvailable(input.name, id)
        }
        return yield* d.sideEffects.update(id, input)
      }).pipe(Effect.withSpan("Organization.update", { attributes: { id } })),

    remove: (id) =>
      d.sideEffects
        .remove(id)
        .pipe(Effect.withSpan("Organization.remove", { attributes: { id } })),
  }
}
