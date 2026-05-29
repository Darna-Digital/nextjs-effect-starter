import { Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";

export const ProjectId = S.String.pipe(S.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectName = S.Trim.pipe(S.check(S.isMinLength(1)));

/**
 * Provisioning lifecycle of a project. A project starts as "provisioning" and
 * the project-provisioning workflow flips it to "active" once it completes.
 */
export const ProvisioningStatus = S.Literals(["provisioning", "active"]);
export type ProvisioningStatus = typeof ProvisioningStatus.Type;

export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  ownerId: S.String,
  status: ProvisioningStatus,
  createdAt: S.String,
});
export type Project = typeof ProjectSchema.Type;

export class ProjectNotFound extends S.TaggedErrorClass<ProjectNotFound>()(
  "ProjectNotFound",
  { id: ProjectId },
  { httpApiStatus: 404 },
) {}
