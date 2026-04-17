import type { Effect } from "effect"
import type {
  Organization,
  OrganizationId,
  CreateOrganization,
  UpdateOrganization,
  OrganizationNotFound,
} from "./organization.schema"
import { StorageError } from "@/layers/persistance/persistence.base"

/**
 * DI contract consumed by the functions layer. Adapters supply a `data`
 * bag (config-like values) and `sideEffects` (persistence, clock, IDs…).
 *
 * The shape of the public `OrganizationFunctions` is inferred from
 * `createOrganizationFunctions` via `ReturnType<…>` — no need to declare
 * it twice.
 */
export interface OrganizationDependencies {
  data: {
    /** Lower-cased names that cannot be used as organization names. */
    reservedNames: ReadonlySet<string>
  }
  sideEffects: {
    getAll: () => Effect.Effect<Organization[], StorageError>
    getById: (
      id: OrganizationId,
    ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
    create: (
      input: CreateOrganization,
    ) => Effect.Effect<Organization, StorageError>
    update: (
      id: OrganizationId,
      input: UpdateOrganization,
    ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
    remove: (
      id: OrganizationId,
    ) => Effect.Effect<void, OrganizationNotFound | StorageError>
  }
}
