import { Layer } from "effect";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createDbProjectRepository } from "@/features/project/repository/project.repository.db";
import { Provisioning } from "@/features/provisioning/service/provisioning.service";

/**
 * The {@link Provisioning} service backed by the live (MySQL) project
 * repository. Used by the workflow runtime that executes provisioning steps.
 *
 * Kept free of any workflow/SDK imports so the runtime can depend on it without
 * a cycle (`provisioning.client.live.ts` holds the SDK-facing trigger layer).
 */
export const ProvisioningLive = Layer.effect(
  Provisioning,
  Provisioning.make,
).pipe(
  Layer.provide(Layer.succeed(ProjectRepository, createDbProjectRepository)),
);
