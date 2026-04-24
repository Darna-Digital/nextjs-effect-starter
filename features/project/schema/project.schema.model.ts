import { Data, Schema as S } from "effect";
import { OrganizationId } from "@/features/organization/schema/organization.schema.model";
import { UserId } from "@/features/auth/schema/auth.schema.model";

export const ProjectId = S.String.pipe(S.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectName = S.Trim.pipe(S.minLength(1));

export const ProjectSchema = S.Struct({
  id: ProjectId,
  name: ProjectName,
  description: S.optional(S.String),
  organizationId: OrganizationId,
  ownerId: UserId,
  createdAt: S.String,
});
export type Project = typeof ProjectSchema.Type;

export class ProjectNotFound extends Data.TaggedError("ProjectNotFound")<{
  readonly id: ProjectId;
}> {
  toResponse(): Response {
    return Response.json({ error: "Not found", id: this.id }, { status: 404 });
  }
}
