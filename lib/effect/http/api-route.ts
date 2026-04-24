import { Data, Effect, ManagedRuntime, Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { AppRuntime } from "@/lib/effect/layers/runtime";
import { CurrentUser } from "@/lib/effect/layers/auth";
import { RequestUserResolver } from "@/lib/effect/http/request-user";
import {
  RateLimiter,
  type RateLimitConfig,
} from "@/lib/effect/layers/rate-limit";

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export type RenderableError = {
  toResponse(): Response;
};

class InvalidJsonBody extends Data.TaggedError("InvalidJsonBody") {
  toResponse(): Response {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

type AnySchema = Schema.Schema.AnyNoContext;

type InferSchema<Spec> =
  Spec extends Schema.Schema<infer Decoded, infer _Encoded, never>
    ? Decoded
    : undefined;

type RequestContext =
  | ManagedRuntime.ManagedRuntime.Context<typeof AppRuntime>
  | CurrentUser;

type RouteHandler<Body, Params, Query, Failure, Success> = (ctx: {
  body: Body;
  params: Params;
  query: Query;
}) => Effect.Effect<Success, Failure, RequestContext>;

type NextRouteContext = { params: Promise<Record<string, string>> };

export function apiRoute<
  BodySchema extends AnySchema | undefined = undefined,
  ParamsSchema extends AnySchema | undefined = undefined,
  QuerySchema extends AnySchema | undefined = undefined,
  Failure = never,
  Success = unknown,
>(config: {
  span: string;
  body?: BodySchema;
  params?: ParamsSchema;
  query?: QuerySchema;
  status?: number;
  handle: RouteHandler<
    InferSchema<BodySchema>,
    InferSchema<ParamsSchema>,
    InferSchema<QuerySchema>,
    Failure,
    Success
  >;
  rateLimit?: RateLimitConfig;
}) {
  const status = config.status ?? 200;

  return async (
    request: Request,
    context?: NextRouteContext,
  ): Promise<Response> => {
    const url = new URL(request.url);
    const rawParams = (await context?.params) ?? {};
    const rawQuery = Object.fromEntries(url.searchParams);

    const program = Effect.gen(function* () {
      if (config.rateLimit) {
        const limiter = yield* RateLimiter;
        yield* limiter.check({
          ...config.rateLimit,
          key: `${config.rateLimit.key}:${clientIp(request)}`,
        });
      }

      const resolver = yield* RequestUserResolver;
      const user = yield* resolver.resolve(request);

      const params = config.params
        ? yield* Schema.decodeUnknown(config.params)(rawParams)
        : undefined;

      const query = config.query
        ? yield* Schema.decodeUnknown(config.query)(rawQuery)
        : undefined;

      let body: unknown = undefined;
      if (config.body) {
        const raw = yield* Effect.tryPromise({
          try: () => request.json(),
          catch: () => new InvalidJsonBody(),
        });
        body = yield* Schema.decodeUnknown(config.body)(raw);
      }

      yield* Effect.annotateCurrentSpan("user.id", user.id);

      const result = yield* config
        .handle({
          body: body as InferSchema<BodySchema>,
          params: params as InferSchema<ParamsSchema>,
          query: query as InferSchema<QuerySchema>,
        })
        .pipe(Effect.provideService(CurrentUser, user));

      yield* Effect.annotateCurrentSpan("http.response.status_code", status);

      return status === 204
        ? new Response(null, { status: 204 })
        : Response.json(result, { status });
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
            );
          }
          if (isRenderableError(error)) {
            return error.toResponse();
          }
          console.error("Unhandled apiRoute error", error);
          return Response.json(
            { error: "Internal server error" },
            { status: 500 },
          );
        }),
      ),
    );

    return AppRuntime.runPromise(program);
  };
}

function isRenderableError(value: unknown): value is RenderableError {
  return (
    typeof value === "object" &&
    value !== null &&
    "toResponse" in value &&
    typeof (value as { toResponse: unknown }).toResponse === "function"
  );
}
