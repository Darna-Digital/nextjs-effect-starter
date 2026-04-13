import type { Effect } from "effect"
import type {
  Organization,
  OrganizationId,
  CreateOrganization,
  UpdateOrganization,
  OrganizationNotFound,
} from "./organization.schema"
import type { StorageError } from "@/lib/errors"

export interface OrganizationDependencies {
  data: Record<string, never>
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
  ) => Effect.Effect<Organization, StorageError>
  update: (
    id: OrganizationId,
    input: UpdateOrganization,
  ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
  remove: (
    id: OrganizationId,
  ) => Effect.Effect<void, OrganizationNotFound | StorageError>
}
