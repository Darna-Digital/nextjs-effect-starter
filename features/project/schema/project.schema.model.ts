import { Data, Schema as S } from "effect"
import { OrganizationId } from "@/features/organization/schema/organization.schema.model"
import { UserId } from "@/features/auth/schema/auth.schema.model"

export const ProjectId = S.String.pipe(S.brand("ProjectId"))
export type ProjectId = typeof ProjectId.Type

/** Non-empty name after trimming. Exported for reuse by the request schemas. */
export const ProjectName = S.Trim.pipe(S.minLength(1))

/**
 * The Project entity — write-model. A project belongs to an organization
 * via `organizationId`. Reads that need the org hydrated can be added
 * later via a join query + richer read-model.
 */
export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  /** The user who owns this project. Stamped from `CurrentUser` on create. */
  ownerId: UserId,
  createdAt: S.String,
})
export type Project = typeof ProjectSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Domain errors
// ─────────────────────────────────────────────────────────────────────────────

export class ProjectNotFound extends Data.TaggedError("ProjectNotFound")<{
  readonly id: ProjectId
}> {
  toResponse(): Response {
    return Response.json({ error: "Not found", id: this.id }, { status: 404 })
  }
}
