import { Effect, Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { runStep, type RunStepOptions } from "@/lib/effect/workflow/step";

/**
 * A runtime for executing workflow step bodies.
 *
 * Steps run in the world's queue worker — a separate request, outside the Effect
 * HTTP handler — so they can't use the request-scoped runtime. A
 * `WorkflowRuntime` wraps a standalone, lazily-initialised {@link ManagedRuntime}
 * built from a feature's layer (with tracing added) and runs Effects through the
 * {@link runStep} bridge.
 */
export interface WorkflowRuntime<R> {
  /**
   * Run an Effect as a step body, mapping failures to the SDK's retry model.
   * Per-call `options` override the runtime's defaults.
   */
  readonly run: <A, E>(
    effect: Effect.Effect<A, E, R>,
    options?: RunStepOptions,
  ) => Promise<A>;
  /** The underlying runtime, exposed for advanced/escape-hatch use. */
  readonly managed: ManagedRuntime.ManagedRuntime<R, never>;
}

/**
 * Build a {@link WorkflowRuntime} from a feature's layer. Tracing is added
 * automatically. `defaults` (e.g. `isFatal`) apply to every `run` call unless
 * overridden.
 *
 * @example
 * export const provisioningRuntime = makeWorkflowRuntime(ProvisioningLive, {
 *   isFatal: (e) => e instanceof ProjectNotFound,
 * });
 */
export const makeWorkflowRuntime = <R>(
  layer: Layer.Layer<R, never>,
  defaults: RunStepOptions = {},
): WorkflowRuntime<R> => {
  const managed = ManagedRuntime.make(Layer.mergeAll(layer, TracingLayer));
  return {
    managed,
    run: (effect, options) =>
      runStep(managed, effect, { ...defaults, ...options }),
  };
};
