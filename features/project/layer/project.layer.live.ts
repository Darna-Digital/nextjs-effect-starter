import { Layer } from "effect";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createDbProjectRepository } from "@/features/project/repository/project.repository.db";
import { Projects } from "@/features/project/service/project.service";

export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(Layer.succeed(ProjectRepository, createDbProjectRepository)),
);
