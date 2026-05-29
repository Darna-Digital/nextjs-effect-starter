import { Effect, Layer } from "effect";
import { start } from "workflow/api";
import { Workflows } from "@/lib/effect/workflow/client";

/**
 * Live {@link Workflows}: enqueues runs via the Workflow SDK's `start()`, traced
 * and best-effort (enqueue failures are logged, never surfaced to the caller).
 */
export const WorkflowsLive = Layer.succeed(Workflows, {
  start: (workflow, args) =>
    Effect.tryPromise(() => start(workflow, args)).pipe(
      Effect.asVoid,
      Effect.withSpan("Workflows.start", {
        attributes: { "workflow.name": workflow.name },
      }),
      Effect.tapCause((cause) =>
        Effect.logError("Failed to start workflow", cause),
      ),
      Effect.ignore,
    ),
});
