import type { paths } from "./api-schema";

type Json<T> = T extends { content: { "application/json": infer J } }
  ? J
  : never;

export type Organization =
  paths["/api/organizations/{id}"]["get"]["responses"][200] extends infer R
    ? Json<R>
    : never;

export type Project =
  paths["/api/projects/{id}"]["get"]["responses"][200] extends infer R
    ? Json<R>
    : never;

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
