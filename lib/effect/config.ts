import { Schema as S } from "effect"

/**
 * Validated app config, read from `process.env` at boot. Every knob that
 * changes runtime behaviour goes through this schema so a typo in
 * `.env.local` fails loudly with a readable error — no silent `NaN`s
 * from `Number(undefined)` or guessed defaults baked into multiple files.
 *
 * **Server-only.** Never import from a client component — the schema
 * requires `DATABASE_URL` and `AUTH_SECRET`, which aren't in the browser.
 */

const RawConfigSchema = S.Struct({
  NODE_ENV: S.optional(S.Literal("development", "production", "test")),

  DATABASE_URL: S.String.pipe(S.minLength(1)),

  /** HMAC secret for JWT signing. Must be ≥32 bytes for HS256. */
  AUTH_SECRET: S.String.pipe(
    S.filter((s) => new TextEncoder().encode(s).byteLength >= 32, {
      message: () =>
        "AUTH_SECRET must be at least 32 bytes. Generate one with: openssl rand -hex 32",
    }),
  ),

  AUTH_ACCESS_TOKEN_EXPIRES_IN: S.optional(S.String),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: S.optional(
    S.NumberFromString.pipe(S.int(), S.positive()),
  ),

  OTEL_EXPORTER_OTLP_ENDPOINT: S.optional(S.String),
  OTEL_SERVICE_NAME: S.optional(S.String),
})

const raw = S.decodeUnknownSync(RawConfigSchema)(process.env, {
  errors: "all",
})

export const config = {
  nodeEnv: raw.NODE_ENV ?? "development",
  isProduction: raw.NODE_ENV === "production",
  databaseUrl: raw.DATABASE_URL,
  authSecret: raw.AUTH_SECRET,
  accessTokenExpiresIn: raw.AUTH_ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenTtlSeconds:
      raw.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60,
  otelEndpoint: raw.OTEL_EXPORTER_OTLP_ENDPOINT,
  otelServiceName: raw.OTEL_SERVICE_NAME ?? "nextjs-effect-starter",
} as const
