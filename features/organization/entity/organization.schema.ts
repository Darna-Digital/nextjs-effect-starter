import { Data, Schema as S } from "effect"

export const OrganizationId = S.String.pipe(S.brand("OrganizationId"))
export type OrganizationId = typeof OrganizationId.Type

/** Non-empty name after trimming (rejects whitespace-only input). */
const OrganizationName = S.Trim.pipe(S.minLength(1))

export const OrganizationSchema = S.Struct({
  id: OrganizationId,
  name: OrganizationName,
  description: S.optional(S.String),
})
export type Organization = typeof OrganizationSchema.Type

export const CreateOrganizationSchema = S.Struct({
  name: OrganizationName,
  description: S.optional(S.String),
})
export type CreateOrganization = typeof CreateOrganizationSchema.Type

export const UpdateOrganizationSchema = S.Struct({
  name: S.optional(OrganizationName),
  description: S.optional(S.String),
})
export type UpdateOrganization = typeof UpdateOrganizationSchema.Type

export class OrganizationNotFound extends Data.TaggedError(
  "OrganizationNotFound",
)<{
  readonly id: OrganizationId
}> {}

export class OrganizationNameTaken extends Data.TaggedError(
  "OrganizationNameTaken",
)<{
  readonly name: string
}> {}

export class OrganizationNameReserved extends Data.TaggedError(
  "OrganizationNameReserved",
)<{
  readonly name: string
}> {}

/**
 * Shape of error bodies returned by the organization API.
 * Used on the client via composable-fetcher's `errorSchema` so the frontend
 * sees a typed, discriminated union instead of an untyped JSON blob.
 */
export const OrganizationApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Name already taken"), name: S.String }),
  S.Struct({ error: S.Literal("Name is reserved"), name: S.String }),
  S.Struct({ error: S.Literal("Not found"), id: S.String }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Storage error"), cause: S.String }),
)
export type OrganizationApiError = typeof OrganizationApiErrorSchema.Type
