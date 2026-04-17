import { Effect } from "effect"
import type { PersistenceLayer } from "@/layers/persistance/persistence.base"
import type { OrganizationDependencies } from "../entity/organization.interfaces"
import {
  OrganizationNotFound,
  type Organization,
  type OrganizationId,
} from "../entity/organization.schema"

/**
 * Wires a `PersistenceLayer<Organization>` into the side-effects shape
 * that the functions layer consumes. Shared by the JSON-backed adapter
 * and the in-memory test mock — same semantics, different storage.
 */
export const createOrganizationSideEffects = (
  persistence: PersistenceLayer<Organization>,
): OrganizationDependencies["sideEffects"] => ({
  getAll: () => persistence.getAll(),

  getById: (id) =>
    persistence.getById(id).pipe(
      Effect.catchTag("EntityNotFound", ({ id }) =>
        Effect.fail(new OrganizationNotFound({ id })),
      ),
    ),

  create: (input) =>
    persistence.create({
      id: crypto.randomUUID() as OrganizationId,
      ...input,
    }),

  update: (id, input) =>
    persistence.update(id, input).pipe(
      Effect.catchTag("EntityNotFound", ({ id }) =>
        Effect.fail(new OrganizationNotFound({ id })),
      ),
    ),

  remove: (id) =>
    persistence.remove(id).pipe(
      Effect.catchTag("EntityNotFound", ({ id }) =>
        Effect.fail(new OrganizationNotFound({ id })),
      ),
    ),
})
