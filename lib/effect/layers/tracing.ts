import { OtlpTracer, OtlpSerialization } from "@effect/opentelemetry"
import { NodeHttpClient } from "@effect/platform-node"
import { Layer } from "effect"

/**
 * OTLP tracing — only enabled when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
 * Unset → a no-op layer, so production without a collector doesn't spam
 * failed POSTs every span.
 *
 * Set to something like `http://localhost:4318` in dev; the collector
 * usually exposes `/v1/traces` on that host.
 */
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

export const TracingLayer: Layer.Layer<never> = endpoint
  ? (OtlpTracer.layer({
      url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
      resource: {
        serviceName:
          process.env.OTEL_SERVICE_NAME ?? "nextjs-effect-starter",
        serviceVersion: "0.1.0",
      },
    }).pipe(
      Layer.provide(OtlpSerialization.layerJson),
      Layer.provide(NodeHttpClient.layerUndici),
    ) as Layer.Layer<never>)
  : Layer.empty
