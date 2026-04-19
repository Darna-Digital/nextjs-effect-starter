import { Context, Effect } from "effect"
import type { Storage } from "@/layers/storage/storage"
import {
  OrganizationInUse,
  OrganizationNotFound,
  OrganizationNameReserved,
  OrganizationNameTaken,
  type Organization,
  type OrganizationId,
} from "./organization.model"
import type {
  CreateOrganization,
  UpdateOrganization,
} from "./organization.requests"

export class OrganizationStorage extends Context.Tag("OrganizationStorage")<
  OrganizationStorage,
  Storage<Organization>
>() {}

export class ReservedOrganizationNames extends Context.Tag(
  "ReservedOrganizationNames",
)<ReservedOrganizationNames, readonly string[]>() {}

/**
 * The organization service. Rails-style call sites:
 *
 *     yield* Organizations.create({ name: "Acme" })
 *     yield* Organizations.getAll()
 *
 * Storage errors (`EntityNotFound`, `EntityInUse`) are translated to
 * domain errors at each call site via `Effect.catchTag` / `catchTags`.
 * Inline because TypeScript only infers the `Id` brand when the source
 * effect is concrete in the pipe chain.
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

      return {
        getAll: () =>
          storage.getAll().pipe(Effect.withSpan("Organizations.getAll")),

        getById: (id: OrganizationId) =>
          storage.getById(id).pipe(
            Effect.catchTag("EntityNotFound", (e) =>
              Effect.fail(new OrganizationNotFound({ id: e.id })),
            ),
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
            return yield* storage.update(id, input).pipe(
              Effect.catchTag("EntityNotFound", (e) =>
                Effect.fail(new OrganizationNotFound({ id: e.id })),
              ),
            )
          }).pipe(
            Effect.withSpan("Organizations.update", {
              attributes: { "organization.id": id },
            }),
          ),

        remove: (id: OrganizationId) =>
          storage.remove(id).pipe(
            Effect.catchTags({
              EntityNotFound: (e) =>
                Effect.fail(new OrganizationNotFound({ id: e.id })),
              EntityInUse: (e) =>
                Effect.fail(new OrganizationInUse({ id: e.id })),
            }),
            Effect.withSpan("Organizations.remove", {
              attributes: { "organization.id": id },
            }),
          ),
      }
    }),
  },
) {}
