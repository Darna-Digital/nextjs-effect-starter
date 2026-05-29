import { HttpApiBuilder } from "@effect/platform";
import { Api } from "@/lib/effect/http/api";
import { Organizations } from "@/features/organization/service/organization.service";

export const OrganizationHandlers = HttpApiBuilder.group(
  Api,
  "organizations",
  (handlers) =>
    handlers
      .handle("list", () => Organizations.list())
      .handle("create", ({ payload }) => Organizations.create(payload))
      .handle("getById", ({ path }) => Organizations.getById(path.id))
      .handle("update", ({ path, payload }) =>
        Organizations.update(path.id, payload),
      )
      .handle("remove", ({ path }) => Organizations.remove(path.id)),
);
