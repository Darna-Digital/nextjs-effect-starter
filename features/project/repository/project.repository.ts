import { Context, Effect } from "effect"
import type { UserId } from "@/features/auth/schema/auth.schema.model"
import type { OrganizationId } from "@/features/organization/schema/organization.schema.model"
import {
  StorageError,
  type Patch,
} from "@/lib/effect/layers/storage"
import { ProjectNotFound, type Project, type ProjectId } from "@/features/project/schema/project.schema.model"

/**
 * Project-specific repository — replaces the generic `Storage<T>`. Tailored
 * methods (`list(filter)`) let us push filtering down to the DB in prod and
 * keep the memory impl to a few lines for tests.
 *
 * The repo emits **domain** errors (`ProjectNotFound`) directly, so the
 * service stays thin — no `catchTag("EntityNotFound", ...)` ceremony.
 */
export type ProjectFilter = {
  // `| undefined` matches what `S.optional(...)` decodes to under
  // `exactOptionalPropertyTypes: true` — lets the query schema flow straight
  // into the repo without adapter code at the route.
  ownerId?: UserId | undefined
  organizationId?: OrganizationId | undefined
}

export interface ProjectRepo {
  list: (filter?: ProjectFilter) => Effect.Effect<Project[], StorageError>
  get: (
    id: ProjectId,
  ) => Effect.Effect<Project, ProjectNotFound | StorageError>
  create: (project: Project) => Effect.Effect<Project, StorageError>
  update: (
    id: ProjectId,
    patch: Patch<Project>,
  ) => Effect.Effect<Project, ProjectNotFound | StorageError>
  remove: (
    id: ProjectId,
  ) => Effect.Effect<void, ProjectNotFound | StorageError>
}

export class ProjectRepository extends Context.Tag("ProjectRepository")<
  ProjectRepository,
  ProjectRepo
>() {}
