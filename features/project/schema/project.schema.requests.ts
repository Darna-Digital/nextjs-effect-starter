import { Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";
import { ProjectName } from "@/features/project/schema/project.schema.model";

export const CreateProjectSchema = S.Struct({
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
});
export type CreateProject = typeof CreateProjectSchema.Type;

export const UpdateProjectSchema = S.Struct({
  name: S.optional(ProjectName),
  description: S.optional(S.String),
});
export type UpdateProject = typeof UpdateProjectSchema.Type;

export const ListProjectsQuerySchema = S.Struct({
  ownerId: S.optional(S.String),
  organizationId: S.optional(OrganizationId),
});

export const ProjectApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Not found"), id: S.String }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Too many requests"), retryAfter: S.Number }),
  S.Struct({ error: S.Literal("Storage error") }),
);
export type ProjectApiError = typeof ProjectApiErrorSchema.Type;
