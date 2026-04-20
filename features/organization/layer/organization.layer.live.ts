import { Layer } from "effect"
import { OrganizationRepository } from "@/features/organization/repository/organization.repository"
import { mysqlOrganizationRepository } from "@/features/organization/repository/organization.repository.mysql"
import {
  Organizations,
  ReservedOrganizationNames,
} from "@/features/organization/service/organization.service"

/** `Organizations` backed by the Drizzle/MySQL repository. */
export const OrganizationsLive = Organizations.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(OrganizationRepository, mysqlOrganizationRepository),
      Layer.succeed(ReservedOrganizationNames, ["admin", "system", "root"]),
    ),
  ),
)
