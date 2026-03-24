import { Data, Schema as S } from "effect"

export const ProjectId = S.String.pipe(S.brand("ProjectId"))
export type ProjectId = typeof ProjectId.Type

export const ProjectSchema = S.Struct({
  id: ProjectId,
  title: S.String.pipe(S.minLength(1)),
})
export type Project = typeof ProjectSchema.Type

export const CreateProjectSchema = S.Struct({
  title: S.String.pipe(S.minLength(1)),
})
export type CreateProject = typeof CreateProjectSchema.Type

export const UpdateProjectSchema = S.Struct({
  title: S.optional(S.String.pipe(S.minLength(1))),
})
export type UpdateProject = typeof UpdateProjectSchema.Type

export class ProjectNotFound extends Data.TaggedError("ProjectNotFound")<{
  readonly id: ProjectId
}> {}
