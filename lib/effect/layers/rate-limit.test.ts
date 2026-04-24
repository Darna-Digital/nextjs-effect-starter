import { describe, expect, it } from "vitest";
import { Effect, Either, Layer, TestClock, TestContext } from "effect";
import {
  RateLimiter,
  RateLimiterLive,
  type RateLimitConfig,
} from "./rate-limit";

const run = <A, E>(effect: Effect.Effect<A, E, RateLimiter>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.either,
      Effect.provide(Layer.mergeAll(RateLimiterLive, TestContext.TestContext)),
    ),
  );

const config: RateLimitConfig = { key: "test", max: 3, windowMs: 1_000 };

describe("RateLimiter.check — window behaviour", () => {
  it("allows up to `max` requests in a single window", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
      }),
    );
    expect(Either.isRight(result)).toBe(true);
  });

  it("rejects the (max+1)-th request with TooManyRequests", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        yield* limiter.check(config); // the one over the line
      }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("TooManyRequests");
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
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result) && result.left._tag === "TooManyRequests") {
      expect(result.left.retryAfter).toBe(1);
    }
  });

  it("refuses subsequent requests without consuming extra budget", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++) yield* limiter.check(config);
        return yield* Effect.all([
          Effect.either(limiter.check(config)),
          Effect.either(limiter.check(config)),
          Effect.either(limiter.check(config)),
        ]);
      }),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      for (const r of result.right) {
        expect(Either.isLeft(r)).toBe(true);
        if (Either.isLeft(r)) expect(r.left._tag).toBe("TooManyRequests");
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
    expect(Either.isRight(result)).toBe(true);
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
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("TooManyRequests");
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
    expect(Either.isRight(result)).toBe(true);
  });

  it("rejects on `a` while `b` is still allowed", async () => {
    const result = await run(
      Effect.gen(function* () {
        const limiter = yield* RateLimiter;
        for (let i = 0; i < config.max; i++)
          yield* limiter.check({ ...config, key: "a" });
        const aRejection = yield* Effect.either(
          limiter.check({ ...config, key: "a" }),
        );
        const bSuccess = yield* Effect.either(
          limiter.check({ ...config, key: "b" }),
        );
        return { aRejection, bSuccess };
      }),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(Either.isLeft(result.right.aRejection)).toBe(true);
      expect(Either.isRight(result.right.bSuccess)).toBe(true);
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
        const overLogin = yield* Effect.either(
          limiter.check({ key: "login", max: 10, windowMs: 60_000 }),
        );
        for (let i = 0; i < 5; i++)
          yield* limiter.check({ key: "register", max: 5, windowMs: 60_000 });
        const overRegister = yield* Effect.either(
          limiter.check({ key: "register", max: 5, windowMs: 60_000 }),
        );
        return { overLogin, overRegister };
      }),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(Either.isLeft(result.right.overLogin)).toBe(true);
      expect(Either.isLeft(result.right.overRegister)).toBe(true);
    }
  });
});
