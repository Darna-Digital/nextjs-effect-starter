import { Data, Effect, ManagedRuntime, Schema } from "effect"
import { ParseError } from "effect/ParseResult"
import { AppRuntime } from "@/lib/effect/layers/runtime"
import { CurrentUser } from "@/lib/effect/layers/auth"
import { RequestUserResolver } from "@/lib/effect/http/request-user"
import { RateLimiter, type RateLimitConfig } from "@/lib/effect/layers/rate-limit"

/** `X-Forwarded-For` first hop, then `X-Real-IP`, else `"unknown"`. */
const clientIp = (request: Request): string => {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

/**
 * Contract for errors that render themselves as HTTP responses.
 *
 * Each domain error class implements `toResponse()` so the HTTP shape
 * lives next to the error definition — no switchboard in the adapter.
 */
export interface RenderableError {
  toResponse(): Response
}

class InvalidJsonBody extends Data.TaggedError("InvalidJsonBody") {
  toResponse(): Response {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}

// Schemas consumed at the edge have no dependencies — `R` is always `never`.
type AnySchema = Schema.Schema.AnyNoContext

type InferSchema<S> =
  S extends Schema.Schema<infer A, infer _I, never> ? A : undefined

/** What a route handler may freely depend on: app-wide services + the current user. */
type RequestContext =
  | ManagedRuntime.ManagedRuntime.Context<typeof AppRuntime>
  | CurrentUser

type RouteHandler<Body, Params, Query, E, A> = (ctx: {
  body: Body
  params: Params
  query: Query
}) => Effect.Effect<A, E, RequestContext>

type NextRouteContext = { params: Promise<Record<string, string>> }

/**
 * Declarative Next.js route handler — the sole bridge from Effect to Next.js.
 *
 * Responsibilities (and nothing else):
 *  - Decode route `params` and request `body` via Effect Schema
 *  - Resolve `CurrentUser` for the request via `RequestUserResolver`
 *  - Run `handle` through `AppRuntime`
 *  - Render `RenderableError` / `ParseError` → HTTP responses
 *
 * Auth strategy (bearer, cookie, API key…) is injected through
 * `RequestUserResolver` — this file has no opinion on it.
 *
 * `status: 204` emits an empty-body response regardless of handler return.
 */
export function apiRoute<
  BodySchema extends AnySchema | undefined = undefined,
  ParamsSchema extends AnySchema | undefined = undefined,
  QuerySchema extends AnySchema | undefined = undefined,
  E = never,
  A = unknown,
>(config: {
  span: string
  body?: BodySchema
  params?: ParamsSchema
  query?: QuerySchema
  status?: number
  handle: RouteHandler<
    InferSchema<BodySchema>,
    InferSchema<ParamsSchema>,
    InferSchema<QuerySchema>,
    E,
    A
  >
  rateLimit?: RateLimitConfig
}) {
  const status = config.status ?? 200

  return async (
    request: Request,
    context?: NextRouteContext,
  ): Promise<Response> => {
    const url = new URL(request.url)
    const rawParams = (await context?.params) ?? {}
    const rawQuery = Object.fromEntries(url.searchParams)

    const program = Effect.gen(function* () {
      if (config.rateLimit) {
        const limiter = yield* RateLimiter
        yield* limiter.check({
          ...config.rateLimit,
          // Scope the bucket per-IP at the edge so the service stays
          // transport-agnostic.
          key: `${config.rateLimit.key}:${clientIp(request)}`,
        })
      }

      const resolver = yield* RequestUserResolver
      const user = yield* resolver.resolve(request)

      const params = config.params
        ? yield* Schema.decodeUnknown(config.params)(rawParams)
        : undefined

      const query = config.query
        ? yield* Schema.decodeUnknown(config.query)(rawQuery)
        : undefined

      let body: unknown = undefined
      if (config.body) {
        const raw = yield* Effect.tryPromise({
          try: () => request.json(),
          catch: () => new InvalidJsonBody(),
        })
        body = yield* Schema.decodeUnknown(config.body)(raw)
      }

      yield* Effect.annotateCurrentSpan("user.id", user.id)

      const result = yield* config
        .handle({
          body: body as InferSchema<BodySchema>,
          params: params as InferSchema<ParamsSchema>,
          query: query as InferSchema<QuerySchema>,
        })
        .pipe(Effect.provideService(CurrentUser, user))

      yield* Effect.annotateCurrentSpan("http.response.status_code", status)

      return status === 204
        ? new Response(null, { status: 204 })
        : Response.json(result, { status })
    }).pipe(
      Effect.withSpan(config.span, {
        attributes: {
          "http.request.method": request.method,
          "http.route": url.pathname,
        },
      }),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          if (error instanceof ParseError) {
            return Response.json(
              { error: "Validation failed", details: error.message },
              { status: 400 },
            )
          }
          if (isRenderableError(error)) {
            return error.toResponse()
          }
          // Unexpected error — log server-side (the span already carries
          // correlation) and return a flat body so we never leak internals.
          console.error("Unhandled apiRoute error", error)
          return Response.json(
            { error: "Internal server error" },
            { status: 500 },
          )
        }),
      ),
    )

    return AppRuntime.runPromise(program)
  }
}

function isRenderableError(value: unknown): value is RenderableError {
  return (
    typeof value === "object" &&
    value !== null &&
    "toResponse" in value &&
    typeof (value as { toResponse: unknown }).toResponse === "function"
  )
}
