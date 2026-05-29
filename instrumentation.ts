/**
 * Starts the Workflow SDK's world on server boot.
 *
 * The self-hosted MySQL world (`@fantasticfour/world-mysql`, selected via
 * `WORKFLOW_TARGET_WORLD`) runs a long-lived queue worker that polls
 * `workflow.workflow_jobs` and dispatches steps over HTTP to
 * `/.well-known/workflow/v1/*`. Without `start()` the workers never poll, so
 * workflows would be enqueued but never executed.
 *
 * The Local World (the default when `WORKFLOW_TARGET_WORLD` is unset) has no
 * `start()`, so this is a no-op there.
 *
 * @see https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { getWorld } = await import("workflow/runtime");
    await getWorld().start?.();
  }
}
