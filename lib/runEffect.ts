import { Effect } from "effect"
import { TodoRepo, type StorageError, type TodoNotFound } from "./TodoRepo"
import { JsonTodoRepo } from "./JsonTodoRepo"
import type { ParseError } from "effect/ParseResult"

// This is the "edge" where Effect meets the outside world.
//
// Instead of letting errors leak as `unknown`, we map each typed error
// to an HTTP response. Effect.catchTags lets you pattern-match on errors
// by their _tag — exhaustive, type-safe error handling.

const MainLayer = JsonTodoRepo
// ^ To swap storage, change this one line.

type AppError = StorageError | TodoNotFound | ParseError

export const provideAndRun = <A>(
  effect: Effect.Effect<A, AppError, TodoRepo>,
): Promise<A | Response> =>
  effect.pipe(
    // catchTags pattern-matches on the _tag field of each error type.
    // The compiler ensures you handle every error in the union.
    // If you add a new error type to a repo method, this won't compile
    // until you handle it here — no silent ignoring of failure modes.
    Effect.catchTags({
      TodoNotFound: (e) =>
        Effect.succeed(
          Response.json({ error: "Not found", id: e.id }, { status: 404 }),
        ),
      StorageError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Storage error", cause: String(e.cause) },
            { status: 500 },
          ),
        ),
      ParseError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Validation failed", details: e.message },
            { status: 400 },
          ),
        ),
    }),
    Effect.provide(MainLayer),
    Effect.runPromise,
  )
