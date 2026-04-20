import { Context, Effect } from "effect"
import { StorageError, type Patch } from "@/lib/effect/layers/storage"
import {
  OrganizationInUse,
  OrganizationNameTaken,
  OrganizationNotFound,
  type Organization,
  type OrganizationId,
} from "@/features/organization/schema/organization.schema.model"

/**
 * Organization repository. Tailored methods emit **domain** errors directly
 * (`OrganizationNotFound`, `OrganizationInUse`, `OrganizationNameTaken`) —
 * no `catchTag("EntityNotFound", ...)` ceremony in the service.
 */
export interface OrganizationRepo {
  list: () => Effect.Effect<Organization[], StorageError>
  get: (
    id: OrganizationId,
  ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
  /** Fails with `OrganizationNameTaken` if the unique index rejects the insert. */
  create: (
    org: Organization,
  ) => Effect.Effect<Organization, OrganizationNameTaken | StorageError>
  update: (
    id: OrganizationId,
    patch: Patch<Organization>,
  ) => Effect.Effect<
    Organization,
    OrganizationNotFound | OrganizationNameTaken | StorageError
  >
  remove: (
    id: OrganizationId,
  ) => Effect.Effect<
    void,
    OrganizationNotFound | OrganizationInUse | StorageError
  >
}

export class OrganizationRepository extends Context.Tag(
  "OrganizationRepository",
)<OrganizationRepository, OrganizationRepo>() {}
