import { Data, Schema as S } from "effect"
import { OrganizationId } from "@/features/organization/organization.schema"

export const ProjectId = S.String.pipe(S.brand("ProjectId"))
export type ProjectId = typeof ProjectId.Type

/** Non-empty name after trimming. */
const ProjectName = S.Trim.pipe(S.minLength(1))

export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  createdBy: S.String,
  createdAt: S.String,
})
export type Project = typeof ProjectSchema.Type

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

export class ProjectNotFound extends Data.TaggedError("ProjectNotFound")<{
  readonly id: ProjectId
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Not found", id: this.id },
      { status: 404 },
    )
  }
}
