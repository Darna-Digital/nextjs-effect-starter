import { Schema as S } from "effect"
import { OrganizationName } from "./organization.model"

// ─────────────────────────────────────────────────────────────────────────────
// Inputs — request payloads decoded at the HTTP edge
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Wire error shape — consumed by the client via composable-fetcher's
// `errorSchema` so the frontend sees a typed, discriminated union.
// ─────────────────────────────────────────────────────────────────────────────

export const OrganizationApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Name already taken"), name: S.String }),
  S.Struct({ error: S.Literal("Name is reserved"), name: S.String }),
  S.Struct({ error: S.Literal("Not found"), id: S.String }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Storage error"), cause: S.String }),
)
export type OrganizationApiError = typeof OrganizationApiErrorSchema.Type
