import { Cause, Effect, Exit } from "effect";
import { FatalError, sleep } from "workflow";
import {
  ProjectNotFound,
  type ProjectId,
} from "@/features/project/schema/project.schema.model";
import { Provisioning } from "@/features/provisioning/service/provisioning.service";
import { provisioningRuntime } from "@/features/provisioning/runtime/provisioning.runtime";

/**
 * Durable project-provisioning workflow (Workflow SDK).
 *
 * Triggered when a project is created (see `ProvisioningClient`). The workflow
 * orchestrates; each `"use step"` is enqueued and runs on its own request, with
 * the suspension between them surviving restarts. The step bodies are thin
 * adapters that run the {@link Provisioning} Effect service through a
 * {@link ManagedRuntime}, so all business logic stays in Effect with DI.
 */
export async function provisionProject(projectId: string) {
  "use workflow";

  // Simulate provisioning work — suspends without consuming resources.
  await sleep("5s");
  await activateProject(projectId);
  await notifyProjectOwner(projectId);

  return { projectId, status: "active" as const };
}

async function activateProject(projectId: string) {
  "use step";
  await runProvisioningStep(
    Effect.flatMap(Provisioning, (s) => s.activate(projectId as ProjectId)),
  );
}

async function notifyProjectOwner(projectId: string) {
  "use step";
  await runProvisioningStep(
    Effect.flatMap(Provisioning, (s) => s.notifyOwner(projectId as ProjectId)),
  );
}

/**
 * Runs a {@link Provisioning} effect on the shared runtime and bridges Effect
 * failures to the SDK's retry semantics:
 *   - `ProjectNotFound` is permanent → `FatalError` (the SDK will not retry).
 *   - anything else (e.g. a `StorageError`) is transient → a plain throw, which
 *     the SDK retries with backoff.
 */
async function runProvisioningStep(
  effect: Effect.Effect<void, unknown, Provisioning>,
): Promise<void> {
  const exit = await provisioningRuntime.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) return;

  const error = Cause.squash(exit.cause);
  if (error instanceof ProjectNotFound) {
    throw new FatalError(`Project not found: ${error.id}`);
  }
  throw error instanceof Error ? error : new Error(Cause.pretty(exit.cause));
}
