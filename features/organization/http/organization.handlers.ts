import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "@/lib/effect/http/api";
import { Organizations } from "@/features/organization/service/organization.service";

export const OrganizationHandlers = HttpApiBuilder.group(
  Api,
  "organizations",
  (handlers) =>
    handlers
      .handle("list", () => Effect.flatMap(Organizations, (s) => s.list()))
      .handle("create", ({ payload }) =>
        Effect.flatMap(Organizations, (s) => s.create(payload)),
      )
      .handle("getById", ({ params }) =>
        Effect.flatMap(Organizations, (s) => s.getById(params.id)),
      )
      .handle("update", ({ params, payload }) =>
        Effect.flatMap(Organizations, (s) => s.update(params.id, payload)),
      )
      .handle("remove", ({ params }) =>
        Effect.flatMap(Organizations, (s) => s.remove(params.id)),
      ),
);
