import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "@/lib/effect/http/api";
import { Projects } from "@/features/project/service/project.service";

export const ProjectHandlers = HttpApiBuilder.group(Api, "projects", (handlers) =>
  handlers
    .handle("list", ({ query }) => Effect.flatMap(Projects, (s) => s.list(query)))
    .handle("create", ({ payload }) =>
      Effect.flatMap(Projects, (s) => s.create(payload)),
    )
    .handle("getById", ({ params }) =>
      Effect.flatMap(Projects, (s) => s.getById(params.id)),
    )
    .handle("update", ({ params, payload }) =>
      Effect.flatMap(Projects, (s) => s.update(params.id, payload)),
    )
    .handle("remove", ({ params }) =>
      Effect.flatMap(Projects, (s) => s.remove(params.id)),
    ),
);
