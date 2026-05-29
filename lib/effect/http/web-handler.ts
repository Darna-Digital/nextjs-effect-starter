import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { Api } from "@/lib/effect/http/api";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { AuthenticationLive } from "@/features/auth/http/auth.middleware.live";
import { OrganizationHandlers } from "@/features/organization/http/organization.handlers";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectHandlers } from "@/features/project/http/project.handlers";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

const MiddlewareLive = AuthenticationLive;

const ServicesLive = Layer.mergeAll(OrganizationsLive, ProjectsLive);

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(Layer.mergeAll(OrganizationHandlers, ProjectHandlers)),
  Layer.provide(MiddlewareLive),
  Layer.provide(ServicesLive),
  Layer.provide(TracingLayer),
);

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext),
);

export const apiHandler = (request: Request): Promise<Response> =>
  handler(request);
