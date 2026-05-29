import { Context, Effect } from "effect"
import type { OrganizationId } from "@/features/organization/schema/organization.schema.model"
import {
  StorageError,
  type Patch,
} from "@/lib/effect/layers/storage"
import { ProjectNotFound, type Project, type ProjectId } from "@/features/project/schema/project.schema.model"

export type ProjectFilter = {
  ownerId?: string | undefined
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

export class ProjectRepository extends Context.Service<
  ProjectRepository,
  ProjectRepo
>()("ProjectRepository") {}
