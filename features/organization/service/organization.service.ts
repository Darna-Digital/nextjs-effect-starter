import { Context, Effect } from "effect"
import { OrganizationRepository } from "@/features/organization/repository/organization.repository"
import {
  OrganizationNameReserved,
  OrganizationNameTaken,
  type OrganizationId,
} from "@/features/organization/schema/organization.schema.model"
import type {
  CreateOrganization,
  UpdateOrganization,
} from "@/features/organization/schema/organization.schema.requests"

/** Reserved names that can't be used by tenants (config tag, not storage). */
export class ReservedOrganizationNames extends Context.Tag(
  "ReservedOrganizationNames",
)<ReservedOrganizationNames, readonly string[]>() {}

/**
 * The organization service. Rails-style call sites:
 *
 *     yield* Organizations.create({ name: "Acme" })
 *     yield* Organizations.list()
 *
 * The repository emits domain errors (`OrganizationNotFound`,
 * `OrganizationInUse`) directly — no translation ceremony here.
 */
export class Organizations extends Effect.Service<Organizations>()(
  "Organizations",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const repo = yield* OrganizationRepository
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
          const all = yield* repo.list()
          const conflict = all.find(
            (o) =>
              o.id !== ignoreId &&
              o.name.toLowerCase() === name.toLowerCase(),
          )
          if (conflict)
            return yield* Effect.fail(new OrganizationNameTaken({ name }))
        })

      return {
        list: () => repo.list().pipe(Effect.withSpan("Organizations.list")),

        getById: (id: OrganizationId) =>
          repo.get(id).pipe(
            Effect.withSpan("Organizations.getById", {
              attributes: { "organization.id": id },
            }),
          ),

        create: (input: CreateOrganization) =>
          Effect.gen(function* () {
            yield* assertNotReserved(input.name)
            yield* assertNameAvailable(input.name)
            return yield* repo.create({
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
            return yield* repo.update(id, input)
          }).pipe(
            Effect.withSpan("Organizations.update", {
              attributes: { "organization.id": id },
            }),
          ),

        remove: (id: OrganizationId) =>
          repo.remove(id).pipe(
            Effect.withSpan("Organizations.remove", {
              attributes: { "organization.id": id },
            }),
          ),
      }
    }),
  },
) {}
