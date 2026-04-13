import { Data, Schema as S } from "effect"

export const OrganizationId = S.String.pipe(S.brand("OrganizationId"))
export type OrganizationId = typeof OrganizationId.Type

export const OrganizationSchema = S.Struct({
  id: OrganizationId,
  name: S.String.pipe(S.minLength(1)),
  description: S.optional(S.String),
})
export type Organization = typeof OrganizationSchema.Type

export const CreateOrganizationSchema = S.Struct({
  name: S.String.pipe(S.minLength(1)),
  description: S.optional(S.String),
})
export type CreateOrganization = typeof CreateOrganizationSchema.Type

export const UpdateOrganizationSchema = S.Struct({
  name: S.optional(S.String.pipe(S.minLength(1))),
  description: S.optional(S.String),
})
export type UpdateOrganization = typeof UpdateOrganizationSchema.Type

export class OrganizationNotFound extends Data.TaggedError(
  "OrganizationNotFound",
)<{
  readonly id: OrganizationId
}> {}
