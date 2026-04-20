import { Layer } from "effect"
import type { Project } from "@/features/project/schema/project.schema.model"
import { ProjectRepository } from "@/features/project/repository/project.repository"
import { createMemoryProjectRepository } from "@/features/project/repository/project.repository.memory"
import { Projects } from "@/features/project/service/project.service"

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
