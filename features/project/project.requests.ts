import { Schema as S } from "effect"
import { OrganizationId } from "@/features/organization/organization.model"
import { ProjectName } from "./project.model"

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
