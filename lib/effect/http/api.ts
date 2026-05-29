import { HttpApi } from "@effect/platform";
import { AuthApi } from "@/features/auth/http/auth.api";
import { OrganizationApi } from "@/features/organization/http/organization.api";
import { ProjectApi } from "@/features/project/http/project.api";

/**
 * The full HTTP API surface, mounted under `/api`. This module is import-safe
 * on both server and client: it references only endpoint/schema definitions
 * (no handlers or services), so the browser can derive a typed client from it.
 */
export class Api extends HttpApi.make("nextjs-effect-starter")
  .add(AuthApi)
  .add(OrganizationApi)
  .add(ProjectApi)
  .prefix("/api") {}
