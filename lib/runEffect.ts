import { Effect, type Exit } from "effect"
import { TodoRepo } from "./TodoRepo"
import { JsonTodoRepo } from "./JsonTodoRepo"

// This is the "edge" where Effect meets the outside world.
//
// Effect programs are lazy descriptions — they don't do anything until you run them.
// Effect.provide attaches the Layer (dependencies), then runPromiseExit executes it.
//
// Exit is Effect's equivalent of try/catch: it's either a Success or a Failure.
// Using runPromiseExit instead of runPromise gives us structured error handling.

const MainLayer = JsonTodoRepo
// ^ To swap storage, change this one line. E.g.:
// const MainLayer = PostgresTodoRepo

export const provideAndRun = <A>(
  effect: Effect.Effect<A, unknown, TodoRepo>,
): Promise<Exit.Exit<A, unknown>> =>
  Effect.runPromiseExit(Effect.provide(effect, MainLayer))
