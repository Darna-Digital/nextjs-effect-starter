import {
  Clock,
  Context,
  Effect,
  HashMap,
  Layer,
  Option,
  Ref,
  Schema as S,
} from "effect";

export class TooManyRequests extends S.TaggedErrorClass<TooManyRequests>()(
  "TooManyRequests",
  { retryAfter: S.Number },
  { httpApiStatus: 429 },
) {}

export type RateLimitConfig = {
  readonly key: string;
  readonly max: number;
  readonly windowMs: number;
};

type Bucket = { readonly count: number; readonly resetAt: number };

export class RateLimiter extends Context.Service<
  RateLimiter,
  {
    readonly check: (
      config: RateLimitConfig,
    ) => Effect.Effect<void, TooManyRequests>;
  }
>()("RateLimiter") {}

export const RateLimiterLive = Layer.effect(
  RateLimiter,
  Effect.gen(function* () {
    const buckets = yield* Ref.make(HashMap.empty<string, Bucket>());

    return {
      check: ({ key, max, windowMs }) =>
        Effect.gen(function* () {
          const now = yield* Clock.currentTimeMillis;

          const retryAfter = yield* Ref.modify(
            buckets,
            (map): [number, HashMap.HashMap<string, Bucket>] => {
              const existing = HashMap.get(map, key);

              // Window expired or brand-new key → start a fresh window.
              if (Option.isNone(existing) || existing.value.resetAt < now) {
                return [
                  0,
                  HashMap.set(map, key, {
                    count: 1,
                    resetAt: now + windowMs,
                  }),
                ];
              }

              const bucket = existing.value;
              if (bucket.count >= max) {
                const secs = Math.max(
                  1,
                  Math.ceil((bucket.resetAt - now) / 1000),
                );
                return [secs, map];
              }

              return [
                0,
                HashMap.set(map, key, {
                  count: bucket.count + 1,
                  resetAt: bucket.resetAt,
                }),
              ];
            },
          );

          if (retryAfter > 0) {
            return yield* Effect.fail(new TooManyRequests({ retryAfter }));
          }
        }),
    };
  }),
);
