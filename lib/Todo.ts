import { Schema } from "effect"

// Schema defines both the TypeScript type AND runtime validation in one place.
// Think of it as Zod but integrated into Effect's ecosystem.

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String.pipe(Schema.minLength(1)),
  completed: Schema.Boolean,
})
export type Todo = typeof Todo.Type

// A separate schema for create — no id, no completed (defaults to false)
export const CreateTodo = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
})
export type CreateTodo = typeof CreateTodo.Type

export const UpdateTodo = Schema.Struct({
  title: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  completed: Schema.optional(Schema.Boolean),
})
export type UpdateTodo = typeof UpdateTodo.Type
