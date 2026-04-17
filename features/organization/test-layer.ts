import { Layer } from "effect"
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory"
import type { Organization } from "./entity/organization.schema"
import {
  Organizations,
  OrganizationStorage,
  ReservedOrganizationNames,
} from "./service"

/**
 * Test Layer — in-memory store, configurable reserved names.
 * Provide it to any Effect that depends on `Organizations`:
 *
 *     program.pipe(Effect.provide(OrganizationsTest([seed])))
 */
export const OrganizationsTest = (
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
