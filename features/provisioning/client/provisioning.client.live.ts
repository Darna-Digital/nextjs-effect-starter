import { Effect, Layer } from "effect";
import { start } from "workflow/api";
import type { ProjectId } from "@/features/project/schema/project.schema.model";
import { ProvisioningClient } from "@/features/provisioning/client/provisioning.client";
import { provisionProject } from "@/features/provisioning/workflow/provisioning.workflow";

/**
 * Live {@link ProvisioningClient}: enqueues the durable provisioning workflow
 * via the Workflow SDK's `start()`. Triggering is best-effort and never fails
 * the calling request — a failure to enqueue is logged, not surfaced (so a
 * transient world outage doesn't block project creation).
 *
 * Imports the workflow + SDK, so it is kept separate from `ProvisioningLive`
 * (which the step runtime depends on) to avoid an import cycle.
 */
export const ProvisioningClientLive = Layer.succeed(ProvisioningClient, {
  start: (projectId: ProjectId) =>
    Effect.tryPromise(() => start(provisionProject, [projectId])).pipe(
      Effect.asVoid,
      Effect.withSpan("ProvisioningClient.start", {
        attributes: { "project.id": projectId },
      }),
      Effect.tapCause((cause) =>
        Effect.logError("Failed to start provisioning workflow", cause),
      ),
      Effect.ignore,
    ),
});
