import { Context, Effect, Layer } from "effect";

/** A workflow function as the SDK triggers it: `(...args) => Promise<result>`. */
export type WorkflowFn<Args extends unknown[]> = (
  ...args: Args
) => Promise<unknown>;

/**
 * The single, app-wide service for triggering durable workflows — inject it
 * anywhere and call `start(myWorkflow, [args])`. Keeping triggering behind one
 * service (rather than calling the SDK inline) means domain code depends on an
 * interface, not the Workflow SDK, so it stays unit-testable.
 *
 * `start` is best-effort: a failure to enqueue is logged and swallowed, so a
 * transient world outage can't fail the primary operation. Implementations:
 * `WorkflowsLive` (real, in `client.live.ts`) and `WorkflowsNoop` (tests, below).
 */
export interface WorkflowsApi {
  readonly start: <Args extends unknown[]>(
    workflow: WorkflowFn<Args>,
    args: Args,
  ) => Effect.Effect<void>;
}

export class Workflows extends Context.Service<Workflows, WorkflowsApi>()(
  "Workflows",
) {}

/** No-op for tests / in-memory stacks: starts nothing, never touches the SDK. */
export const WorkflowsNoop = Layer.succeed(Workflows, {
  start: () => Effect.void,
});
