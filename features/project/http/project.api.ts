import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
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
    HttpApiEndpoint.get("list", "/projects")
      .setUrlParams(ListProjectsQuerySchema)
      .addSuccess(S.Array(ProjectSchema))
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.post("create", "/projects")
      .setPayload(CreateProjectSchema)
      .addSuccess(ProjectSchema, { status: 201 })
      .addError(OrganizationNotFound)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.get("getById", "/projects/:id")
      .setPath(IdParam)
      .addSuccess(ProjectSchema)
      .addError(ProjectNotFound)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.put("update", "/projects/:id")
      .setPath(IdParam)
      .setPayload(UpdateProjectSchema)
      .addSuccess(ProjectSchema)
      .addError(ProjectNotFound)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.del("remove", "/projects/:id")
      .setPath(IdParam)
      .addSuccess(HttpApiSchema.NoContent)
      .addError(ProjectNotFound)
      .addError(StorageError),
  )
  .middleware(Authentication) {}
