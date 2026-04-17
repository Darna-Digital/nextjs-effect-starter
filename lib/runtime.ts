import { Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "./tracing";
import { OrganizationsLive } from "@/features/organization/organization.layers.live";

/**
 * Single long-lived server runtime. All route handlers run their effects
 * through this, so tracing + feature services (Organizations, future
 * tenants/auth/etc.) are initialized once per process.
 */
const AppLayer = Layer.mergeAll(TracingLayer, OrganizationsLive);

export const AppRuntime = ManagedRuntime.make(AppLayer);
