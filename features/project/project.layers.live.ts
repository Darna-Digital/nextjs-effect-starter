import { Layer } from "effect";
import { createJsonPersistence } from "@/layers/persistance/persistence.json";
import type { Project } from "./project.schema";
import { ProjectStorage, Projects } from "./project.service";

/** JSON-file-backed Layer for Projects. */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(
    Layer.succeed(
      ProjectStorage,
      createJsonPersistence<Project>("./data/projects.json"),
    ),
  ),
);
