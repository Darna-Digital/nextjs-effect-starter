import type { Effect } from "effect"
import type {
  Project,
  ProjectId,
  CreateProject,
  UpdateProject,
  ProjectNotFound,
} from "./project.schema"
import type { StorageError } from "@/lib/errors"

export interface ProjectDependencies {
  data: Record<string, never>
  sideEffects: {
    getAll: () => Effect.Effect<Project[], StorageError>
    getById: (
      id: ProjectId,
    ) => Effect.Effect<Project, ProjectNotFound | StorageError>
    create: (input: CreateProject) => Effect.Effect<Project, StorageError>
    update: (
      id: ProjectId,
      input: UpdateProject,
    ) => Effect.Effect<Project, ProjectNotFound | StorageError>
    remove: (
      id: ProjectId,
    ) => Effect.Effect<void, ProjectNotFound | StorageError>
  }
}

export interface ProjectFunctions {
  getAll: () => Effect.Effect<Project[], StorageError>
  getById: (
    id: ProjectId,
  ) => Effect.Effect<Project, ProjectNotFound | StorageError>
  create: (input: CreateProject) => Effect.Effect<Project, StorageError>
  update: (
    id: ProjectId,
    input: UpdateProject,
  ) => Effect.Effect<Project, ProjectNotFound | StorageError>
  remove: (
    id: ProjectId,
  ) => Effect.Effect<void, ProjectNotFound | StorageError>
}
