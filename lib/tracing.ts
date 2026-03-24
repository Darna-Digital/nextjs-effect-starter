import { OtlpTracer, OtlpSerialization } from "@effect/opentelemetry"
import { NodeHttpClient } from "@effect/platform-node"
import { Layer } from "effect"

export const TracingLayer = OtlpTracer.layer({
  url: "http://localhost:4318/v1/traces",
  resource: {
    serviceName: "learning-effect",
    serviceVersion: "0.1.0",
  },
}).pipe(
  Layer.provide(OtlpSerialization.layerJson),
  Layer.provide(NodeHttpClient.layerUndici),
)
