import { Layer } from "effect"
import { createJsonPersistence } from "@/layers/persistance/persistence.json"
import type { Organization } from "./entity/organization.schema"
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization"

/** Layer that provides `Organizations` backed by the JSON file store. */
export const OrganizationsLive = Organizations.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        OrganizationStorage,
        createJsonPersistence<Organization>("./data/organizations.json"),
      ),
      Layer.succeed(
        ReservedOrganizationNames,
        new Set(["admin", "system", "root"]),
      ),
    ),
  ),
)
