import { Effect, Either, type Layer } from "effect"

/**
 * Run an Effect with a provided Layer, capturing success OR failure in
 * an `Either`. Keeps service tests terse:
 *
 *     const result = await runWith(
 *       AuthMemory({ seedUsers: [alice] }),
 *       Auth.login({ email: alice.email, password: "wrong" }),
 *     )
 *     if (Either.isLeft(result)) expect(result.left._tag).toBe("InvalidCredentials")
 */
export const runWith = <A, E, R>(
  layer: Layer.Layer<R>,
  effect: Effect.Effect<A, E, R>,
) => Effect.runPromise(effect.pipe(Effect.either, Effect.provide(layer)))
