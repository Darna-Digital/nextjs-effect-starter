import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import { Schema as S } from "effect";
import { StorageError } from "@/lib/effect/layers/storage";
import { Authentication } from "@/features/auth/http/auth.middleware";
import { OrganizationNotFound } from "@/features/organization/schema/organization.schema.model";
import {
  ProjectId,
  ProjectNotFound,
  ProjectSchema,
} from "@/features/project/schema/project.schema.model";
import {
  CreateProjectSchema,
  ListProjectsQuerySchema,
  UpdateProjectSchema,
} from "@/features/project/schema/project.schema.requests";

const IdParam = S.Struct({ id: ProjectId });

export class ProjectApi extends HttpApiGroup.make("projects")
  .add(
    HttpApiEndpoint.get("list", "/projects", {
      query: ListProjectsQuerySchema,
      success: S.Array(ProjectSchema),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/projects", {
      payload: CreateProjectSchema,
      success: ProjectSchema.pipe(HttpApiSchema.status(201)),
      error: [OrganizationNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.get("getById", "/projects/:id", {
      params: IdParam,
      success: ProjectSchema,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/projects/:id", {
      params: IdParam,
      payload: UpdateProjectSchema,
      success: ProjectSchema,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.delete("remove", "/projects/:id", {
      params: IdParam,
      success: HttpApiSchema.NoContent,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .middleware(Authentication) {}
