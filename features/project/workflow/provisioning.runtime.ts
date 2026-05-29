import { Layer } from "effect";
import { makeWorkflowRuntime } from "@/lib/effect/workflow/runtime";
import { EmailConsole } from "@/lib/effect/layers/email";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createDbProjectRepository } from "@/features/project/repository/project.repository.db";
import { ProjectNotFound } from "@/features/project/schema/project.schema.model";
import { Provisioning } from "@/features/project/service/provisioning.service";

/**
 * The {@link Provisioning} business-logic service backed by the live (MySQL)
 * repository, for use by the step runtime. No workflow/SDK imports here, so it
 * can't introduce an import cycle with the workflow definition.
 */
const ProvisioningLive = Layer.effect(Provisioning, Provisioning.make).pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(ProjectRepository, createDbProjectRepository),
      EmailConsole,
    ),
  ),
);

/**
 * Runtime that executes provisioning steps (Provisioning service + live repo +
 * tracing). A missing project is permanent, so it maps to a `FatalError` (no
 * retry); other failures retry by default.
 */
export const provisioningRuntime = makeWorkflowRuntime(ProvisioningLive, {
  isFatal: (error) => error instanceof ProjectNotFound,
});
