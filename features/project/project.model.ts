import { Data, Schema as S } from "effect"
import {
  OrganizationId,
  type Organization,
} from "@/features/organization/organization.model"
import { UserId } from "@/features/auth/auth.model"

export const ProjectId = S.String.pipe(S.brand("ProjectId"))
export type ProjectId = typeof ProjectId.Type

/** Non-empty name after trimming. Exported for reuse by the request schemas. */
export const ProjectName = S.Trim.pipe(S.minLength(1))

/**
 * The Project entity.
 *
 * Relationship: a project **belongs to** an organization, expressed by the
 * `organizationId` foreign key. This is the write-model — what actually gets
 * stored in a row. When consumers need the org hydrated (e.g. the project
 * list UI wants to show the org's name), use `ProjectWithOrganization`
 * below, produced by a read query that joins.
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

/**
 * Read-model: a Project with its parent Organization embedded.
 * Not the storage shape — storage only has the FK. This is what a join
 * query produces and what UIs that need the org's name consume.
 */
export type ProjectWithOrganization = Project & {
  readonly organization: Organization
}

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
