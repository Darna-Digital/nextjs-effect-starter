import { Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";

export const ProjectId = S.String.pipe(S.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectName = S.Trim.pipe(S.check(S.isMinLength(1)));

export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  ownerId: S.String,
  createdAt: S.String,
});
export type Project = typeof ProjectSchema.Type;

export class ProjectNotFound extends S.TaggedErrorClass<ProjectNotFound>()(
  "ProjectNotFound",
  { id: ProjectId },
  { httpApiStatus: 404 },
) {}
