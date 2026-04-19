import { Layer } from "effect";
import { createMemoryStorageLayer } from "@/layers/storage/storage.memory";
import type { Project } from "./project.model";
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
      Layer.effect(
        ProjectStorage,
        createMemoryStorageLayer<Project>([...seed]),
      ),
    ),
  );
