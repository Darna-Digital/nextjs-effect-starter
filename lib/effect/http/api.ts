import { HttpApi } from "effect/unstable/httpapi";
import { OrganizationApi } from "@/features/organization/http/organization.api";
import { ProjectApi } from "@/features/project/http/project.api";

/**
 * The full HTTP API surface, mounted under `/api`. Authentication is handled by
 * Better Auth at `/api/auth/*` (a separate Next.js route); this Effect API only
 * exposes the application's domain resources, protected by the `Authentication`
 * middleware which validates the Better Auth session.
 *
 * This module is import-safe on both server and client: it references only
 * endpoint/schema definitions (no handlers or services), so the browser can
 * derive a typed client from it.
 */
export class Api extends HttpApi.make("nextjs-effect-starter")
  .add(OrganizationApi)
  .add(ProjectApi)
  .prefix("/api") {}
