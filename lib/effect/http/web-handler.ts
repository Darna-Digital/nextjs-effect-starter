import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Layer } from "effect";
import { Api } from "@/lib/effect/http/api";
import { RateLimiterLive } from "@/lib/effect/layers/rate-limit";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { AuthenticationLive } from "@/features/auth/http/auth.middleware.live";
import { AuthHandlers } from "@/features/auth/http/auth.handlers";
import { AuthLive } from "@/features/auth/layer/auth.layer.live";
import { OrganizationHandlers } from "@/features/organization/http/organization.handlers";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectHandlers } from "@/features/project/http/project.handlers";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

// Authenticate using the Auth service (needs Auth in scope).
const MiddlewareLive = AuthenticationLive.pipe(Layer.provide(AuthLive));

// All feature services the handlers depend on.
const ServicesLive = Layer.mergeAll(
  AuthLive,
  OrganizationsLive,
  ProjectsLive,
  RateLimiterLive,
);

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(
    Layer.mergeAll(AuthHandlers, OrganizationHandlers, ProjectHandlers),
  ),
  Layer.provide(MiddlewareLive),
  Layer.provide(ServicesLive),
  Layer.provide(TracingLayer),
);

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext),
);

/**
 * Single entry point for every `/api/*` request. The catch-all route delegates
 * all HTTP methods here; the Effect `HttpApi` router matches the method + path.
 */
export const apiHandler = (request: Request): Promise<Response> =>
  handler(request);
