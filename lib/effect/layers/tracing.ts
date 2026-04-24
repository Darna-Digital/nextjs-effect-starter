import { OtlpTracer, OtlpSerialization } from "@effect/opentelemetry";
import { NodeHttpClient } from "@effect/platform-node";
import { Layer } from "effect";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

export const TracingLayer: Layer.Layer<never> = endpoint
  ? (OtlpTracer.layer({
      url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
      resource: {
        serviceName: process.env.OTEL_SERVICE_NAME ?? "nextjs-effect-starter",
        serviceVersion: "0.1.0",
      },
    }).pipe(
      Layer.provide(OtlpSerialization.layerJson),
      Layer.provide(NodeHttpClient.layerUndici),
    ) as Layer.Layer<never>)
  : Layer.empty;
