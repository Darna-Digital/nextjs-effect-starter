import { Layer } from "effect"
import { mysqlStorage } from "@/layers/storage/storage.mysql"
import { db } from "@/lib/db/client"
import type { Organization } from "./organization.model"
import { organizations } from "./organization.table"
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization.service"

/** Layer that provides `Organizations` backed by MySQL (via Drizzle). */
export const OrganizationsLive = Organizations.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        OrganizationStorage,
        mysqlStorage<Organization>(db, organizations),
      ),
      Layer.succeed(ReservedOrganizationNames, ["admin", "system", "root"]),
    ),
  ),
)
