import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { Api } from "@/lib/effect/http/api";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { AuthenticationLive } from "@/features/auth/http/auth.middleware.live";
import { OrganizationHandlers } from "@/features/organization/http/organization.handlers";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectHandlers } from "@/features/project/http/project.handlers";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

// Validates the Better Auth session cookie (self-contained — no Auth service).
const MiddlewareLive = AuthenticationLive;

// All feature services the handlers depend on.
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

/**
 * Single entry point for every `/api/*` request except `/api/auth/*` (which is
 * served by Better Auth's own route). The catch-all route delegates all HTTP
 * methods here; the Effect `HttpApi` router matches the method + path.
 */
export const apiHandler = (request: Request): Promise<Response> =>
  handler(request);
