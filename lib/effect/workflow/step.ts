import { Cause, Effect, Exit, type ManagedRuntime } from "effect";
import { FatalError } from "workflow";

/**
 * How a workflow step should treat an Effect failure.
 *
 * The Workflow SDK retries a step whenever its body throws. `runStep` bridges
 * Effect's typed failures to that model: return `true` from `isFatal` for errors
 * that must NOT be retried — they are rethrown as the SDK's {@link FatalError}.
 * Everything else is rethrown as-is and retried with backoff.
 *
 * Extend by composing predicates, e.g.
 * `isFatal: (e) => e instanceof NotFound || e instanceof Forbidden`.
 */
export interface RunStepOptions {
  readonly isFatal?: (error: unknown) => boolean;
}

/**
 * Run an Effect as the body of a `"use step"` function. Resolves with the
 * success value; on failure either throws {@link FatalError} (no retry, per
 * {@link RunStepOptions.isFatal}) or rethrows the underlying error (SDK retry).
 *
 * This is the seam between the Effect world (typed errors, DI, tracing) and the
 * Workflow SDK's promise-based step contract.
 */
export const runStep = async <A, E, R>(
  runtime: ManagedRuntime.ManagedRuntime<R, never>,
  effect: Effect.Effect<A, E, R>,
  options: RunStepOptions = {},
): Promise<A> => {
  const exit = await runtime.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) return exit.value;

  const error = Cause.squash(exit.cause);
  if (options.isFatal?.(error)) {
    throw new FatalError(
      error instanceof Error ? error.message : String(error),
    );
  }
  throw error instanceof Error ? error : new Error(Cause.pretty(exit.cause));
};
