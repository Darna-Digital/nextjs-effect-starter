import { Layer } from "effect";
import { jsonStorage } from "@/layers/storage/storage.json";
import type { Project } from "./project.model";
import { ProjectStorage, Projects } from "./project.service";

/** JSON-file-backed Layer for Projects. */
export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(
    Layer.succeed(
      ProjectStorage,
      jsonStorage<Project>("./data/projects.json"),
    ),
  ),
);
