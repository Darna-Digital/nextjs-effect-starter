import { Schema as S } from "effect";
export const ProjectSchema = S.Struct({
  id: S.String,
  title: S.String.pipe(S.minLength(1)),
});

export type ProjectType = typeof ProjectSchema.Type;

export const CreateProjectSchema = S.Struct({
  title: S.String.pipe(S.minLength(1)),
});

export type CreateProjectType = typeof CreateProjectSchema.Type;

export const UpdateProjectSchema = S.Struct({
  title: S.optional(S.String.pipe(S.minLength(1))),
});

export type UpdateProjectType = typeof UpdateProjectSchema.Type;
