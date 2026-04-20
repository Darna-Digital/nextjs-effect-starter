import { Layer } from "effect"
import { ProjectRepository } from "@/features/project/repository/project.repository"
import { mysqlProjectRepository } from "@/features/project/repository/project.repository.mysql"
import { Projects } from "@/features/project/service/project.service"

/** `Projects` backed by the Drizzle/MySQL repository. */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(Layer.succeed(ProjectRepository, mysqlProjectRepository)),
)
