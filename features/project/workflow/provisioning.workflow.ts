import { Effect } from "effect";
import { sleep } from "workflow";
import { type ProjectId } from "@/features/project/schema/project.schema.model";
import { Provisioning } from "@/features/project/service/provisioning.service";
import { provisioningRuntime } from "@/features/project/workflow/provisioning.runtime";

/**
 * Durable project-provisioning workflow (Workflow SDK).
 *
 * Triggered when a project is created (`Projects.create` via the `Workflows`
 * service). The workflow
 * orchestrates; each `"use step"` is enqueued and runs on its own request, with
 * the suspension between them surviving restarts. Step bodies are thin adapters
 * that run the {@link Provisioning} Effect service through the shared workflow
 * runtime, so all business logic stays in Effect with DI + tracing.
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
  await provisioningRuntime.run(
    Effect.flatMap(Provisioning, (s) => s.activate(projectId as ProjectId)),
  );
}

async function notifyProjectOwner(projectId: string) {
  "use step";
  await provisioningRuntime.run(
    Effect.flatMap(Provisioning, (s) => s.notifyOwner(projectId as ProjectId)),
  );
}
