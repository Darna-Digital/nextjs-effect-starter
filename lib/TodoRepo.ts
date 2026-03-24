import { Context, Data, Effect } from "effect"
import type { Todo, TodoId, CreateTodo, UpdateTodo } from "./Todo"
import { StorageError } from "./errors"

export { StorageError }

export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: TodoId
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
