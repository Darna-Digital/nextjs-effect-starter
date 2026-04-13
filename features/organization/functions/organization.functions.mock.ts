import { Effect } from "effect"
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory"
import type { OrganizationDependencies } from "../entity/organization.interfaces"
import { OrganizationNotFound } from "../entity/organization.schema"
import type {
  Organization,
  OrganizationId,
  CreateOrganization,
  UpdateOrganization,
} from "../entity/organization.schema"
import { EntityNotFound } from "@/layers/persistance/persistence.base"

export const createOrganizationDependenciesMock = (
  initial: Organization[] = [],
): Effect.Effect<OrganizationDependencies> =>
  Effect.gen(function* () {
    const persistence = yield* createMemoryPersistence<Organization>(initial)

    return {
      data: {},
      sideEffects: {
        getAll: () => persistence.getAll(),

        getById: (id: OrganizationId) =>
          persistence.getById(id).pipe(
            Effect.catchTag("EntityNotFound", (e) =>
              Effect.fail(new OrganizationNotFound({ id: e.id as OrganizationId })),
            ),
          ),

        create: (input: CreateOrganization) => {
          const org: Organization = {
            id: crypto.randomUUID() as OrganizationId,
            name: input.name,
            description: input.description,
          }
          return persistence.create(org)
        },

        update: (id: OrganizationId, input: UpdateOrganization) =>
          persistence.update(id, input).pipe(
            Effect.catchTag("EntityNotFound", (e) =>
              Effect.fail(new OrganizationNotFound({ id: e.id as OrganizationId })),
            ),
          ),

        remove: (id: OrganizationId) =>
          persistence.remove(id).pipe(
            Effect.catchTag("EntityNotFound", (e) =>
              Effect.fail(new OrganizationNotFound({ id: e.id as OrganizationId })),
            ),
          ),
      },
    }
  })
