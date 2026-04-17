import { Layer } from "effect"
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory"
import type { Organization } from "./entity/organization.schema"
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./organization"

/**
 * In-memory Layer — backs `Organizations` with a fresh `Ref`-based store.
 * Used by tests and any dev seeding. Provide it to an effect:
 *
 *     program.pipe(Effect.provide(OrganizationsMemory([seed])))
 */
export const OrganizationsMemory = (
  seed: Organization[] = [],
  reservedNames: ReadonlySet<string> = new Set(),
) =>
  Organizations.Default.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(
          OrganizationStorage,
          createMemoryPersistence<Organization>(seed),
        ),
        Layer.succeed(ReservedOrganizationNames, reservedNames),
      ),
    ),
  )
