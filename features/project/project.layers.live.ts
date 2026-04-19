import { Layer } from "effect";
import { createMysqlStorageLayer } from "@/layers/storage/storage.mysql";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import type { Project } from "./project.model";
import { ProjectStorage, Projects } from "./project.service";

/** MySQL-backed Layer for Projects (via Drizzle). */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(
    Layer.succeed(
      ProjectStorage,
      createMysqlStorageLayer<Project>(db, projects),
    ),
  ),
);
