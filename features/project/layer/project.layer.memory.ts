import { Layer } from "effect";
import type { Project } from "@/features/project/schema/project.schema.model";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createMemoryProjectRepository } from "@/features/project/repository/project.repository.memory";
import { Projects } from "@/features/project/service/project.service";
import { WorkflowsNoop } from "@/lib/effect/workflow/client";

export const ProjectsMemory = ({
  seed = [],
}: { seed?: readonly Project[] } = {}) =>
  Layer.effect(Projects, Projects.make).pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.effect(ProjectRepository, createMemoryProjectRepository(seed)),
        WorkflowsNoop,
      ),
    ),
  );
