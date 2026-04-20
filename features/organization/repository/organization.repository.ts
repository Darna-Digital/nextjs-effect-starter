import { Context, Effect } from "effect"
import { StorageError, type Patch } from "@/lib/effect/layers/storage"
import {
  OrganizationInUse,
  OrganizationNotFound,
  type Organization,
  type OrganizationId,
} from "@/features/organization/schema/organization.schema.model"

/**
 * Organization repository. Tailored methods emit **domain** errors directly
 * (`OrganizationNotFound`, `OrganizationInUse`) — the service stays thin,
 * no `catchTag("EntityNotFound", …)` ceremony.
 */
export interface OrganizationRepo {
  list: () => Effect.Effect<Organization[], StorageError>
  get: (
    id: OrganizationId,
  ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
  create: (org: Organization) => Effect.Effect<Organization, StorageError>
  update: (
    id: OrganizationId,
    patch: Patch<Organization>,
  ) => Effect.Effect<Organization, OrganizationNotFound | StorageError>
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
