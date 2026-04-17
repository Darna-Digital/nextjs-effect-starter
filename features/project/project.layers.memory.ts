import { Layer } from "effect";
import { memoryStorage } from "@/layers/storage/storage.memory";
import type { Project } from "./project.schema";
import { ProjectStorage, Projects } from "./project.service";

/**
 * In-memory Layer for Projects.
 *
 *     ProjectsMemory()
 *     ProjectsMemory({ seed: [proj] })
 */
export const ProjectsMemory = ({
  seed = [],
}: { seed?: readonly Project[] } = {}) =>
  Projects.Default.pipe(
    Layer.provide(
      Layer.effect(ProjectStorage, memoryStorage<Project>([...seed])),
    ),
  );
