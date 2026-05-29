import { Schema as S } from "effect";
import { HttpApiSchema } from "@effect/platform";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";

export const ProjectId = S.String.pipe(S.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectName = S.Trim.pipe(S.minLength(1));

export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  ownerId: S.String,
  createdAt: S.String,
});
export type Project = typeof ProjectSchema.Type;

export class ProjectNotFound extends S.TaggedError<ProjectNotFound>()(
  "ProjectNotFound",
  { id: ProjectId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
