import { Layer, ManagedRuntime } from "effect";
import { TracingLayer } from "@/lib/effect/layers/tracing";
import { ProvisioningLive } from "@/features/provisioning/layer/provisioning.layer.live";

/**
 * A standalone Effect runtime for executing provisioning steps.
 *
 * Workflow steps run in the world's queue worker (a separate request, outside
 * the Effect HTTP handler), so they can't reuse the request-scoped runtime.
 * This `ManagedRuntime` provides the {@link Provisioning} service plus tracing;
 * it is lazy — the layer (and its MySQL pool) is built on first use and then
 * memoized for the lifetime of the server process.
 */
const RuntimeLayer = Layer.mergeAll(ProvisioningLive, TracingLayer);

export const provisioningRuntime = ManagedRuntime.make(RuntimeLayer);
