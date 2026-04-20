import { Schema as S } from "effect"
import { UserId } from "@/features/auth/schema/auth.schema.model"
import { OrganizationId } from "@/features/organization/schema/organization.schema.model"
import { ProjectName } from "@/features/project/schema/project.schema.model"

// ─────────────────────────────────────────────────────────────────────────────
// Inputs — request payloads decoded at the HTTP edge
// ─────────────────────────────────────────────────────────────────────────────

export const CreateProjectSchema = S.Struct({
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
})
export type CreateProject = typeof CreateProjectSchema.Type

export const UpdateProjectSchema = S.Struct({
  name: S.optional(ProjectName),
  description: S.optional(S.String),
})
export type UpdateProject = typeof UpdateProjectSchema.Type

/**
 * Query string for `GET /api/projects`. Both fields optional — empty query
 * means "everything I'm allowed to see." Decoded from raw `Record<string,
 * string>` produced by `URLSearchParams`.
 */
export const ListProjectsQuerySchema = S.Struct({
  ownerId: S.optional(UserId),
  organizationId: S.optional(OrganizationId),
})
export type ListProjectsQuery = typeof ListProjectsQuerySchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Wire error shape — `"Not found"` covers both project and organization
// not-found cases (the server uses the same string for both because the
// frontend renders them the same way).
// ─────────────────────────────────────────────────────────────────────────────

export const ProjectApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Not found"), id: S.String }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Storage error"), cause: S.String }),
)
export type ProjectApiError = typeof ProjectApiErrorSchema.Type
