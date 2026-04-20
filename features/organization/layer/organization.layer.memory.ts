import { Layer } from "effect"
import { OrganizationRepository } from "@/features/organization/repository/organization.repository"
import { createMemoryOrganizationRepository } from "@/features/organization/repository/organization.repository.memory"
import type { Organization } from "@/features/organization/schema/organization.schema.model"
import {
  Organizations,
  ReservedOrganizationNames,
} from "@/features/organization/service/organization.service"

/**
 * In-memory layer for `Organizations`. Fresh store per call.
 *
 *     OrganizationsMemory()
 *     OrganizationsMemory({ seed: [orgA] })
 *     OrganizationsMemory({ reserved: ["admin"] })
 */
export const OrganizationsMemory = ({
  seed = [],
  reserved = [],
}: {
  seed?: readonly Organization[]
  reserved?: readonly string[]
} = {}) =>
  Organizations.Default.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(
          OrganizationRepository,
          createMemoryOrganizationRepository(seed),
        ),
        Layer.succeed(ReservedOrganizationNames, reserved),
      ),
    ),
  )
