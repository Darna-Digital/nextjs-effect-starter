import { Layer } from "effect"
import { mysqlStorage } from "@/layers/storage/storage.mysql"
import { db } from "@/lib/db/client"
import type { Project } from "./project.model"
import { projects } from "./project.table"
import { ProjectStorage, Projects } from "./project.service"

/** MySQL-backed Layer for Projects (via Drizzle). */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(
    Layer.succeed(ProjectStorage, mysqlStorage<Project>(db, projects)),
  ),
)
