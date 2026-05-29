import { describe, expect, it } from "vitest";
import { Effect, Layer, Result } from "effect";
import { TestClock } from "effect/testing";
import {
  RateLimiter,
  RateLimiterLive,
  type RateLimitConfig,
} from "./rate-limit";

function run<Success, Failure>(
  effect: Effect.Effect<Success, Failure, RateLimiter>,
) {
  return Effect.runPromise(
    effect.pipe(
      Effect.result,
      Effect.provide(Layer.mergeAll(RateLimiterLive, TestClock.layer())),
    ),
  );
}

const config: RateLimitConfig = { key: "test", max: 3, windowMs: 1_000 };

describe("RateLimiter.check — window behaviour", () => {
  it("allows up to `max` requests in a single window", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
  });

  it("rejects the (max+1)-th request with TooManyRequests", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        yield* limiter.check(config);
      }),
    );
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result)) {
      expect(result.failure._tag).toBe("TooManyRequests");
    }
  });

  it("reports `retryAfter` in whole seconds, rounded up, never < 1", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        return yield* limiter.check(config);
      }),
    );
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result) && result.failure._tag === "TooManyRequests") {
      expect(result.failure.retryAfter).toBe(1);
    }
  });

  it("refuses subsequent requests without consuming extra budget", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        return yield* Effect.all([
          Effect.result(limiter.check(config)),
          Effect.result(limiter.check(config)),
          Effect.result(limiter.check(config)),
        ]);
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      for (const r of result.success) {
        expect(Result.isFailure(r)).toBe(true);
        if (Result.isFailure(r)) expect(r.failure._tag).toBe("TooManyRequests");
      }
    }
  });

  it("opens a fresh window after `windowMs` elapses (TestClock)", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        yield* TestClock.adjust("1100 millis");
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
  });

  it("still rejects during the window, even just before it expires", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        yield* TestClock.adjust("999 millis");
        return yield* limiter.check(config);
      }),
    );
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result)) {
      expect(result.failure._tag).toBe("TooManyRequests");
    }
  });
});

describe("RateLimiter.check — key isolation", () => {
  it("tracks buckets per-key: exhausting `a` leaves `b` untouched", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++)
          yield* limiter.check({ ...config, key: "a" });
        for (let i = 0; i < config.max; i++)
          yield* limiter.check({ ...config, key: "b" });
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
  });

  it("rejects on `a` while `b` is still allowed", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++)
          yield* limiter.check({ ...config, key: "a" });
        const aRejection = yield* Effect.result(
          limiter.check({ ...config, key: "a" }),
        );
        const bSuccess = yield* Effect.result(
          limiter.check({ ...config, key: "b" }),
        );
        return { aRejection, bSuccess };
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(Result.isFailure(result.success.aRejection)).toBe(true);
      expect(Result.isSuccess(result.success.bSuccess)).toBe(true);
    }
  });
});

describe("RateLimiter.check — varying limits", () => {
  it("honours different `max` values per call site", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < 10; i++)
          yield* limiter.check({ key: "login", max: 10, windowMs: 60_000 });
        const overLogin = yield* Effect.result(
          limiter.check({ key: "login", max: 10, windowMs: 60_000 }),
        );
        for (let i = 0; i < 5; i++)
          yield* limiter.check({ key: "register", max: 5, windowMs: 60_000 });
        const overRegister = yield* Effect.result(
          limiter.check({ key: "register", max: 5, windowMs: 60_000 }),
        );
        return { overLogin, overRegister };
      }),
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(Result.isFailure(result.success.overLogin)).toBe(true);
      expect(Result.isFailure(result.success.overRegister)).toBe(true);
    }
  });
});
