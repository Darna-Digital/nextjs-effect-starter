import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { TestClock } from "effect/testing";
import { RateLimiter, RateLimiterLive, type RateLimitConfig } from "./rate-limit";

const config: RateLimitConfig = { key: "test", max: 3, windowMs: 1_000 };

// RateLimiterLive holds mutable bucket state, so it's provided fresh per test
// (not shared via `layer`). `it.effect` supplies the test services, so the
// limiter reads the TestClock that `TestClock.adjust` controls.
describe("RateLimiter.check — window behaviour", () => {
  it.effect("allows up to `max` requests in a single window", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("rejects the (max+1)-th request with TooManyRequests", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      const error = yield* Effect.flip(limiter.check(config));
      expect(error._tag).toBe("TooManyRequests");
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("reports `retryAfter` in whole seconds, rounded up, never < 1", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      const error = yield* Effect.flip(limiter.check(config));
      expect(error.retryAfter).toBe(1);
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("refuses subsequent requests without consuming extra budget", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      for (let i = 0; i < 3; i++) {
        const error = yield* Effect.flip(limiter.check(config));
        expect(error._tag).toBe("TooManyRequests");
      }
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("opens a fresh window after `windowMs` elapses (TestClock)", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      yield* TestClock.adjust("1100 millis");
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("still rejects during the window, even just before it expires", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      yield* TestClock.adjust("999 millis");
      const error = yield* Effect.flip(limiter.check(config));
      expect(error._tag).toBe("TooManyRequests");
    }).pipe(Effect.provide(RateLimiterLive)),
  );
});

describe("RateLimiter.check — key isolation", () => {
  it.effect("tracks buckets per-key: exhausting `a` leaves `b` untouched", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++)
        yield* limiter.check({ ...config, key: "a" });
      for (let i = 0; i < config.max; i++)
        yield* limiter.check({ ...config, key: "b" });
    }).pipe(Effect.provide(RateLimiterLive)),
  );

  it.effect("rejects on `a` while `b` is still allowed", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < config.max; i++)
        yield* limiter.check({ ...config, key: "a" });
      const aError = yield* Effect.flip(limiter.check({ ...config, key: "a" }));
      expect(aError._tag).toBe("TooManyRequests");
      yield* limiter.check({ ...config, key: "b" }); // still within budget
    }).pipe(Effect.provide(RateLimiterLive)),
  );
});

describe("RateLimiter.check — varying limits", () => {
  it.effect("honours different `max` values per call site", () =>
    Effect.gen(function* () {
      const limiter = yield* RateLimiter;
      for (let i = 0; i < 10; i++)
        yield* limiter.check({ key: "login", max: 10, windowMs: 60_000 });
      const overLogin = yield* Effect.flip(
        limiter.check({ key: "login", max: 10, windowMs: 60_000 }),
      );
      expect(overLogin._tag).toBe("TooManyRequests");

      for (let i = 0; i < 5; i++)
        yield* limiter.check({ key: "register", max: 5, windowMs: 60_000 });
      const overRegister = yield* Effect.flip(
        limiter.check({ key: "register", max: 5, windowMs: 60_000 }),
      );
      expect(overRegister._tag).toBe("TooManyRequests");
    }).pipe(Effect.provide(RateLimiterLive)),
  );
});
