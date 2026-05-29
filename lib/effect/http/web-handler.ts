import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "@/lib/effect/http/api";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { AuthenticationLive } from "@/features/auth/http/auth.middleware.live";
import { OrganizationHandlers } from "@/features/organization/http/organization.handlers";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectHandlers } from "@/features/project/http/project.handlers";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

const ServicesLive = Layer.mergeAll(OrganizationsLive, ProjectsLive);

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(Layer.mergeAll(OrganizationHandlers, ProjectHandlers)),
  Layer.provide(AuthenticationLive),
  Layer.provide(HttpServer.layerServices),
  Layer.provide(TracingLayer),
  HttpRouter.provideRequest(ServicesLive),
);

const { handler } = HttpRouter.toWebHandler(ApiLive);

export const apiHandler = (request: Request): Promise<Response> =>
  handler(request);
