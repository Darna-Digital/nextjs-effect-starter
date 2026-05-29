import { Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";
import { ProjectName } from "@/features/project/schema/project.schema.model";

export const CreateProjectSchema = S.Struct({
  name: ProjectName,
  description: S.optionalWith(S.String, { exact: true }),
  organizationId: OrganizationId,
});
export type CreateProject = typeof CreateProjectSchema.Type;

export const UpdateProjectSchema = S.Struct({
  name: S.optionalWith(ProjectName, { exact: true }),
  description: S.optionalWith(S.String, { exact: true }),
});
export type UpdateProject = typeof UpdateProjectSchema.Type;

export const ListProjectsQuerySchema = S.Struct({
  ownerId: S.optionalWith(S.String, { exact: true }),
  organizationId: S.optionalWith(OrganizationId, { exact: true }),
});
