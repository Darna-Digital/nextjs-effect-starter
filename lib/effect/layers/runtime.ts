import { Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "./tracing";
import { RateLimiterLive } from "@/lib/effect/layers/rate-limit";
import { AuthStackLive } from "@/features/auth/layer/auth.layer.live";
import { OrganizationsLive } from "@/features/organization/layer/organization.layer.live";
import { ProjectsLive } from "@/features/project/layer/project.layer.live";

const AppLayer = Layer.mergeAll(
  TracingLayer,
  RateLimiterLive,
  AuthStackLive,
  OrganizationsLive,
  ProjectsLive,
);

export const AppRuntime = ManagedRuntime.make(AppLayer);
