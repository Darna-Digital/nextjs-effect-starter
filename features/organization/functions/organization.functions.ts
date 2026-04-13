import { Effect } from "effect"
import type {
  OrganizationDependencies,
  OrganizationFunctions,
} from "../entity/organization.interfaces"

export function createOrganizationFunctions(
  d: OrganizationDependencies,
): OrganizationFunctions {
  return {
    getAll: () =>
      d.sideEffects.getAll().pipe(Effect.withSpan("Organization.getAll")),

    getById: (id) =>
      d.sideEffects
        .getById(id)
        .pipe(Effect.withSpan("Organization.getById", { attributes: { id } })),

    create: (input) =>
      d.sideEffects
        .create(input)
        .pipe(
          Effect.withSpan("Organization.create", {
            attributes: { name: input.name },
          }),
        ),

    update: (id, input) =>
      d.sideEffects
        .update(id, input)
        .pipe(Effect.withSpan("Organization.update", { attributes: { id } })),

    remove: (id) =>
      d.sideEffects
        .remove(id)
        .pipe(Effect.withSpan("Organization.remove", { attributes: { id } })),
  }
}
