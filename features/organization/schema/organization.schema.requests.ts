import { Schema as S } from "effect";
import { OrganizationName } from "@/features/organization/schema/organization.schema.model";

export const CreateOrganizationSchema = S.Struct({
  name: OrganizationName,
  description: S.optionalWith(S.String, { exact: true }),
});
export type CreateOrganization = typeof CreateOrganizationSchema.Type;

export const UpdateOrganizationSchema = S.Struct({
  name: S.optionalWith(OrganizationName, { exact: true }),
  description: S.optionalWith(S.String, { exact: true }),
});
export type UpdateOrganization = typeof UpdateOrganizationSchema.Type;
