import { Context, Effect } from "effect"
import {
  mapEntityNotFound,
  type PersistenceLayer,
} from "@/layers/persistance/persistence.base"
import {
  OrganizationNotFound,
  OrganizationNameReserved,
  OrganizationNameTaken,
  type CreateOrganization,
  type Organization,
  type OrganizationId,
  type UpdateOrganization,
} from "./organization.schema"

/**
 * Storage backend. Swap the Layer (JSON ↔ memory ↔ Postgres) without
 * touching business logic.
 */
export class OrganizationStorage extends Context.Tag("OrganizationStorage")<
  OrganizationStorage,
  PersistenceLayer<Organization>
>() {}

/** Names the product refuses at creation time. Injected for test configurability. */
export class ReservedOrganizationNames extends Context.Tag(
  "ReservedOrganizationNames",
)<ReservedOrganizationNames, readonly string[]>() {}

/**
 * The organization service. Call sites read Rails-style:
 *
 *     yield* Organizations.create({ name: "Acme" })
 *     yield* Organizations.getAll()
 *
 * `accessors: true` generates static methods that resolve the service
 * internally. Business logic lives here and nowhere else.
 */
export class Organizations extends Effect.Service<Organizations>()(
  "Organizations",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const storage = yield* OrganizationStorage
      const reserved = yield* ReservedOrganizationNames

      const assertNotReserved = (name: string) =>
        reserved.includes(name.toLowerCase())
          ? Effect.fail(new OrganizationNameReserved({ name }))
          : Effect.void

      const assertNameAvailable = (
        name: string,
        ignoreId?: OrganizationId,
      ) =>
        Effect.gen(function* () {
          const all = yield* storage.getAll()
          const conflict = all.find(
            (o) =>
              o.id !== ignoreId &&
              o.name.toLowerCase() === name.toLowerCase(),
          )
          if (conflict)
            return yield* Effect.fail(new OrganizationNameTaken({ name }))
        })

      const toNotFound = mapEntityNotFound(
        (id: OrganizationId) => new OrganizationNotFound({ id }),
      )

      return {
        getAll: () =>
          storage.getAll().pipe(Effect.withSpan("Organizations.getAll")),

        getById: (id: OrganizationId) =>
          storage.getById(id).pipe(
            toNotFound,
            Effect.withSpan("Organizations.getById", {
              attributes: { "organization.id": id },
            }),
          ),

        create: (input: CreateOrganization) =>
          Effect.gen(function* () {
            yield* assertNotReserved(input.name)
            yield* assertNameAvailable(input.name)
            return yield* storage.create({
              id: crypto.randomUUID() as OrganizationId,
              ...input,
            })
          }).pipe(
            Effect.withSpan("Organizations.create", {
              attributes: { "organization.name": input.name },
            }),
          ),

        update: (id: OrganizationId, input: UpdateOrganization) =>
          Effect.gen(function* () {
            if (input.name !== undefined) {
              yield* assertNotReserved(input.name)
              yield* assertNameAvailable(input.name, id)
            }
            return yield* storage.update(id, input).pipe(toNotFound)
          }).pipe(
            Effect.withSpan("Organizations.update", {
              attributes: { "organization.id": id },
            }),
          ),

        remove: (id: OrganizationId) =>
          storage.remove(id).pipe(
            toNotFound,
            Effect.withSpan("Organizations.remove", {
              attributes: { "organization.id": id },
            }),
          ),
      }
    }),
  },
) {}
