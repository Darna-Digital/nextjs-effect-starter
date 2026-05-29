import type { paths } from "./api-schema";

/**
 * Frontend-facing types, derived from the generated OpenAPI schema. The browser
 * consumes these (not the Effect domain models) so there is a single, codegen'd
 * source of truth for request/response shapes — no brands, no casts.
 */

type Json<T> = T extends { content: { "application/json": infer J } }
  ? J
  : never;

// Entities (response bodies)
export type Organization =
  paths["/api/organizations/{id}"]["get"]["responses"][200] extends infer R
    ? Json<R>
    : never;

export type Project =
  paths["/api/projects/{id}"]["get"]["responses"][200] extends infer R
    ? Json<R>
    : never;

export type SessionUser = Json<
  paths["/api/auth/me"]["get"]["responses"][200]
>["user"];

// Request bodies
export type CreateOrganizationInput = Json<
  NonNullable<paths["/api/organizations"]["post"]["requestBody"]>
>;
export type UpdateOrganizationInput = Json<
  NonNullable<paths["/api/organizations/{id}"]["put"]["requestBody"]>
>;
export type CreateProjectInput = Json<
  NonNullable<paths["/api/projects"]["post"]["requestBody"]>
>;
export type UpdateProjectInput = Json<
  NonNullable<paths["/api/projects/{id}"]["put"]["requestBody"]>
>;
export type LoginInput = Json<
  NonNullable<paths["/api/auth/login"]["post"]["requestBody"]>
>;
export type RegisterInput = Json<
  NonNullable<paths["/api/auth/register"]["post"]["requestBody"]>
>;
