import { Schema as S } from "effect";
import { OrganizationName } from "@/features/organization/schema/organization.schema.model";

export const CreateOrganizationSchema = S.Struct({
  name: OrganizationName,
  description: S.optionalKey(S.String),
});
export type CreateOrganization = typeof CreateOrganizationSchema.Type;

export const UpdateOrganizationSchema = S.Struct({
  name: S.optionalKey(OrganizationName),
  description: S.optionalKey(S.String),
});
export type UpdateOrganization = typeof UpdateOrganizationSchema.Type;
