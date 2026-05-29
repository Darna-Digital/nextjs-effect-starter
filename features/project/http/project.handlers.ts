import { HttpApiBuilder } from "@effect/platform";
import { Api } from "@/lib/effect/http/api";
import { Projects } from "@/features/project/service/project.service";

export const ProjectHandlers = HttpApiBuilder.group(
  Api,
  "projects",
  (handlers) =>
    handlers
      .handle("list", ({ urlParams }) => Projects.list(urlParams))
      .handle("create", ({ payload }) => Projects.create(payload))
      .handle("getById", ({ path }) => Projects.getById(path.id))
      .handle("update", ({ path, payload }) =>
        Projects.update(path.id, payload),
      )
      .handle("remove", ({ path }) => Projects.remove(path.id)),
);
