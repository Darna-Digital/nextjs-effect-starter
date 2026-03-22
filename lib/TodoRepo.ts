import { Context, Data, Effect } from "effect"
import type { Todo, TodoId, CreateTodo, UpdateTodo } from "./Todo"

// --- Typed Errors ---
// Data.TaggedError gives you:
//   1. A _tag field for pattern matching (like a discriminated union)
//   2. Automatic integration with Effect's error channel
//   3. Nice toString / inspect output for free
//
// The error type flows through the Effect<A, E, R> signature.
// If you call repo.getById(), the compiler knows it can fail with
// TodoNotFound | StorageError — you can't accidentally ignore either.

export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: TodoId
}> {}

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown
}> {}

// --- Service Interface ---
// Now each method declares exactly what can go wrong.
// getAll can fail with StorageError.
// getById can fail with StorageError OR TodoNotFound.
// This is the typed error channel — Effect's alternative to unchecked exceptions.

export class TodoRepo extends Context.Tag("TodoRepo")<
  TodoRepo,
  {
    readonly getAll: Effect.Effect<Todo[], StorageError>
    readonly getById: (id: TodoId) => Effect.Effect<Todo, TodoNotFound | StorageError>
    readonly create: (input: CreateTodo) => Effect.Effect<Todo, StorageError>
    readonly update: (id: TodoId, input: UpdateTodo) => Effect.Effect<Todo, TodoNotFound | StorageError>
    readonly remove: (id: TodoId) => Effect.Effect<void, TodoNotFound | StorageError>
  }
>() {}
