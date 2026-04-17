import { Data, Effect, ManagedRuntime, Schema } from "effect"
import { ParseError } from "effect/ParseResult"
import { AppRuntime } from "@/lib/runtime"

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = Schema.Schema<any, any, never>

type InferSchema<S> = S extends Schema.Schema<infer A, infer _I, never>
  ? A
  : undefined

/** Context the handler may freely depend on — anything the AppRuntime supplies. */
type AppContext = ManagedRuntime.ManagedRuntime.Context<typeof AppRuntime>

type RouteHandler<Body, Params, E, A> = (ctx: {
  body: Body
  params: Params
}) => Effect.Effect<A, E, AppContext>

type NextRouteContext = { params: Promise<Record<string, string>> }

/**
 * Declarative Next.js route handler. Decodes `params` and `body` at the
 * edge via Effect Schema, runs `handle` through the app runtime, and
 * renders any `RenderableError` (or `ParseError`) to its HTTP response.
 *
 * OTel span attributes follow HTTP semantic conventions
 * (`http.request.method`, `http.route`). The span is marked ERROR
 * automatically on failure; success annotates `http.response.status_code`.
 *
 * `status: 204` emits an empty-body response regardless of handler return.
 */
export function apiRoute<
  BodySchema extends AnySchema | undefined = undefined,
  ParamsSchema extends AnySchema | undefined = undefined,
  E = never,
  A = unknown,
>(config: {
  span: string
  body?: BodySchema
  params?: ParamsSchema
  status?: number
  handle: RouteHandler<
    InferSchema<BodySchema>,
    InferSchema<ParamsSchema>,
    E,
    A
  >
}) {
  const status = config.status ?? 200

  return async (
    request: Request,
    context?: NextRouteContext,
  ): Promise<Response> => {
    const url = new URL(request.url)
    const rawParams = (await context?.params) ?? {}

    const program = Effect.gen(function* () {
      const params = config.params
        ? yield* Schema.decodeUnknown(config.params)(rawParams)
        : undefined

      let body: unknown = undefined
      if (config.body) {
        const raw = yield* Effect.tryPromise({
          try: () => request.json(),
          catch: () => new InvalidJsonBody(),
        })
        body = yield* Schema.decodeUnknown(config.body)(raw)
      }

      const result = yield* config.handle({
        body: body as InferSchema<BodySchema>,
        params: params as InferSchema<ParamsSchema>,
      })

      yield* Effect.annotateCurrentSpan(
        "http.response.status_code",
        status,
      )

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
          return Response.json(
            { error: "Internal server error", cause: String(error) },
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
