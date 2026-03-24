import { Context, Data, Effect as E } from "effect";
import {
  CreateProjectType,
  ProjectType,
  UpdateProjectType,
} from "@/features/project/project.entity";

export class ProjectNotFound extends Data.TaggedError("ProjectNotFound")<{
  readonly id: ProjectType["id"];
}> {}

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {}

export class ProjectRepo extends Context.Tag("ProjectRepo")<
  ProjectRepo,
  {
    readonly getAll: E.Effect<ProjectType[], StorageError>;
    readonly getById: (
      id: ProjectType["id"],
    ) => E.Effect<ProjectType, ProjectNotFound | StorageError>;
    readonly create: (
      input: CreateProjectType,
    ) => E.Effect<ProjectType, StorageError>;
    readonly update: (
      id: ProjectType["id"],
      input: UpdateProjectType,
    ) => E.Effect<ProjectType, ProjectNotFound | StorageError>;
    readonly remove: (
      id: ProjectType["id"],
    ) => E.Effect<void, ProjectNotFound | StorageError>;
  }
>() {}
