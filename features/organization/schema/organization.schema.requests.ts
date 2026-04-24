import { Schema as S } from "effect";
import { OrganizationName } from "@/features/organization/schema/organization.schema.model";

export const CreateOrganizationSchema = S.Struct({
  name: OrganizationName,
  description: S.optional(S.String),
});
export type CreateOrganization = typeof CreateOrganizationSchema.Type;

export const UpdateOrganizationSchema = S.Struct({
  name: S.optional(OrganizationName),
  description: S.optional(S.String),
});
export type UpdateOrganization = typeof UpdateOrganizationSchema.Type;

export const OrganizationApiErrorSchema = S.Union(
  S.Struct({ error: S.Literal("Name already taken"), name: S.String }),
  S.Struct({ error: S.Literal("Name is reserved"), name: S.String }),
  S.Struct({ error: S.Literal("Not found"), id: S.String }),
  S.Struct({
    error: S.Literal("Organization has dependent projects"),
    id: S.String,
  }),
  S.Struct({ error: S.Literal("Validation failed"), details: S.String }),
  S.Struct({ error: S.Literal("Too many requests"), retryAfter: S.Number }),
  S.Struct({ error: S.Literal("Storage error") }),
);
export type OrganizationApiError = typeof OrganizationApiErrorSchema.Type;
