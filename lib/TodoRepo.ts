import { Context, Effect } from "effect"
import type { Todo, TodoId, CreateTodo, UpdateTodo } from "./Todo"

// This is the core Effect pattern for dependency injection.
//
// Context.Tag creates a "slot" that must be filled before the program runs.
// The type system tracks which services are needed — if you forget to provide
// one, you get a compile error, not a runtime crash.
//
// The Error type parameter (2nd generic in Effect<A, E, R>) lets each
// implementation declare what can go wrong. Here we use `unknown` to stay flexible.
//
// To swap storage: create a different Layer that fills this same Tag.

export class TodoRepo extends Context.Tag("TodoRepo")<
  TodoRepo,
  {
    readonly getAll: Effect.Effect<Todo[], unknown>
    readonly getById: (id: TodoId) => Effect.Effect<Todo | null, unknown>
    readonly create: (input: CreateTodo) => Effect.Effect<Todo, unknown>
    readonly update: (id: TodoId, input: UpdateTodo) => Effect.Effect<Todo | null, unknown>
    readonly remove: (id: TodoId) => Effect.Effect<boolean, unknown>
  }
>() {}
