import { Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";
import { ProjectName } from "@/features/project/schema/project.schema.model";

export const CreateProjectSchema = S.Struct({
  name: ProjectName,
  description: S.optionalKey(S.String),
  organizationId: OrganizationId,
});
export type CreateProject = typeof CreateProjectSchema.Type;

export const UpdateProjectSchema = S.Struct({
  name: S.optionalKey(ProjectName),
  description: S.optionalKey(S.String),
});
export type UpdateProject = typeof UpdateProjectSchema.Type;

export const ListProjectsQuerySchema = S.Struct({
  ownerId: S.optionalKey(S.String),
  organizationId: S.optionalKey(OrganizationId),
});
