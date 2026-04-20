import { Layer } from "effect"
import type { Project } from "./project.model"
import { ProjectRepository } from "./project.repository"
import { createMemoryProjectRepository } from "./project.repository.memory"
import { Projects } from "./project.service"

/**
 * In-memory Layer for `Projects`.
 *
 *     ProjectsMemory()
 *     ProjectsMemory({ seed: [proj] })
 */
export const ProjectsMemory = ({
  seed = [],
}: { seed?: readonly Project[] } = {}) =>
  Projects.Default.pipe(
    Layer.provide(
      Layer.effect(ProjectRepository, createMemoryProjectRepository(seed)),
    ),
  )
