import { Layer } from "effect"
import { ProjectRepository } from "./project.repository"
import { mysqlProjectRepository } from "./project.repository.mysql"
import { Projects } from "./project.service"

/** `Projects` backed by the Drizzle/MySQL repository. */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(Layer.succeed(ProjectRepository, mysqlProjectRepository)),
)
