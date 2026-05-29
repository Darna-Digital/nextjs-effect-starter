import { HttpApiBuilder, type HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "@/lib/effect/http/api";
import { CurrentUser } from "@/lib/effect/layers/auth";
import {
  RateLimiter,
  type RateLimitConfig,
} from "@/lib/effect/layers/rate-limit";
import {
  completeSession,
  endSession,
  resumeSession,
} from "@/features/auth/auth.http";
import { Auth } from "@/features/auth/service/auth.service";

function clientIp(request: HttpServerRequest.HttpServerRequest): string {
  const xff = request.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return request.headers["x-real-ip"] ?? "unknown";
}

function rateLimit(
  request: HttpServerRequest.HttpServerRequest,
  config: RateLimitConfig,
) {
  return Effect.flatMap(RateLimiter, (limiter) =>
    limiter.check({
      ...config,
      key: `${config.key}:${clientIp(request)}`,
    }),
  );
}

export const AuthHandlers = HttpApiBuilder.group(Api, "auth", (handlers) =>
  handlers
    .handle("register", ({ payload, request }) =>
      Effect.gen(function* () {
        yield* rateLimit(request, {
          key: "auth:register",
          max: 5,
          windowMs: 60_000,
        });
        const session = yield* Auth.register(payload);
        return yield* completeSession(session);
      }),
    )
    .handle("login", ({ payload, request }) =>
      Effect.gen(function* () {
        yield* rateLimit(request, {
          key: "auth:login",
          max: 10,
          windowMs: 60_000,
        });
        const session = yield* Auth.login(payload);
        return yield* completeSession(session);
      }),
    )
    .handle("refresh", ({ request }) =>
      Effect.gen(function* () {
        yield* rateLimit(request, {
          key: "auth:refresh",
          max: 30,
          windowMs: 60_000,
        });
        const session = yield* resumeSession();
        return yield* completeSession(session);
      }),
    )
    .handle("logout", () => endSession())
    .handle("me", () => Effect.map(CurrentUser, (user) => ({ user }))),
);
