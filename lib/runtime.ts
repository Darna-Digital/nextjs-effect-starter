import { Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "./tracing";
import { OrganizationsLive } from "@/features/organization/organization.layers.live";
import { ProjectsLive } from "@/features/project/project.layers.live";

/**
 * Single long-lived server runtime. All route handlers run their effects
 * through this, so tracing + feature services (Organizations, Projects,
 * future tenants/auth/etc.) are initialized once per process.
 *
 * Per-request context (like CurrentUser) is provided by `apiRoute`
 * inside each request — not baked into this runtime.
 */
const AppLayer = Layer.mergeAll(TracingLayer, OrganizationsLive, ProjectsLive);

export const AppRuntime = ManagedRuntime.make(AppLayer);
