import { Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "./tracing";
import { AuthStackLive } from "@/features/auth/layer/auth.layer.live";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

/**
 * Single long-lived server runtime. All route handlers run their effects
 * through this, so tracing + feature services (Auth, Organizations,
 * Projects, ...) are initialized once per process.
 *
 * Per-request context (like CurrentUser) is provided by `apiRoute`
 * inside each request — not baked into this runtime.
 */
const AppLayer = Layer.mergeAll(
  TracingLayer,
  AuthStackLive,
  OrganizationsLive,
  ProjectsLive,
);

export const AppRuntime = ManagedRuntime.make(AppLayer);
