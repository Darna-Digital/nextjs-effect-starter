import { Layer } from "effect";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createDbProjectRepository } from "@/features/project/repository/project.repository.db";
import { Projects } from "@/features/project/service/project.service";
import { WorkflowsLive } from "@/lib/effect/workflow/client.live";

export const ProjectsLive = Layer.effect(Projects, Projects.make).pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(ProjectRepository, createDbProjectRepository),
      WorkflowsLive,
    ),
  ),
);
