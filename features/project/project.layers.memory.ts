import { Layer } from "effect"
import { createMemoryPersistence } from "@/layers/persistance/persistence.memory"
import type { Project } from "./project.schema"
import { ProjectStorage, Projects } from "./project"

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
        createMemoryPersistence<Project>([...seed]),
      ),
    ),
  )
