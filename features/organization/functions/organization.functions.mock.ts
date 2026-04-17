import { Effect } from "effect"
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory"
import type { OrganizationDependencies } from "../entity/organization.interfaces"
import type { Organization } from "../entity/organization.schema"
import { createOrganizationSideEffects } from "../adapters/side-effects"

export const createOrganizationDependenciesMock = (
  initial: Organization[] = [],
  reservedNames: ReadonlySet<string> = new Set(),
): Effect.Effect<OrganizationDependencies> =>
  Effect.gen(function* () {
    const persistence = yield* createMemoryPersistence<Organization>(initial)
    return {
      data: { reservedNames },
      sideEffects: createOrganizationSideEffects(persistence),
    }
  })
