import type { Effect } from "effect"
import type {
  Organization,
  OrganizationId,
  CreateOrganization,
  UpdateOrganization,
  OrganizationNotFound,
  OrganizationNameTaken,
  OrganizationNameReserved,
} from "./organization.schema"
import { StorageError } from "@/layers/persistance/persistence.base"

export interface OrganizationDependencies {
  data: {
    /**
     * Lower-cased names that cannot be used as organization names.
     * Injected so tests and environments can configure it.
     */
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

export interface OrganizationFunctions {
  getAll: () => Effect.Effect<Organization[], StorageError>
  getById: (
    id: OrganizationId,
  ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
  create: (
    input: CreateOrganization,
  ) => Effect.Effect<
    Organization,
    StorageError | OrganizationNameTaken | OrganizationNameReserved
  >
  update: (
    id: OrganizationId,
    input: UpdateOrganization,
  ) => Effect.Effect<
    Organization,
    | OrganizationNotFound
    | StorageError
    | OrganizationNameTaken
    | OrganizationNameReserved
  >
  remove: (
    id: OrganizationId,
  ) => Effect.Effect<void, OrganizationNotFound | StorageError>
}
