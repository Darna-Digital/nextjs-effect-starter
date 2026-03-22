import { Effect, Layer } from "effect"
import * as fs from "node:fs/promises"
import { TodoRepo, StorageError, TodoNotFound } from "./TodoRepo"
import type { Todo, CreateTodo, TodoId, UpdateTodo } from "./Todo"

// Layer = a recipe for constructing a service.
//
// This one builds a TodoRepo backed by a JSON file.
// To swap storage, you'd create a different Layer (e.g., PostgresTodoRepo)
// that satisfies the same TodoRepo tag — no business logic changes needed.

const DATA_PATH = "./data/todos.json"

// Effect.tryPromise catches thrown errors and maps them into our typed StorageError.
// The error is now tracked in the type signature — no silent swallowing.
const readTodos = Effect.tryPromise({
  try: async () => {
    try {
      const raw = await fs.readFile(DATA_PATH, "utf-8")
      return JSON.parse(raw) as Todo[]
    } catch {
      return [] as Todo[]
    }
  },
  catch: (cause) => new StorageError({ cause }),
})

const writeTodos = (todos: Todo[]) =>
  Effect.tryPromise({
    try: async () => {
      await fs.mkdir("./data", { recursive: true })
      await fs.writeFile(DATA_PATH, JSON.stringify(todos, null, 2))
    },
    catch: (cause) => new StorageError({ cause }),
  })

export const JsonTodoRepo = Layer.succeed(TodoRepo, {
  getAll: readTodos,

  getById: (id: TodoId) =>
    Effect.gen(function* () {
      const todos = yield* readTodos
      const todo = todos.find((t) => t.id === id)
      if (!todo) return yield* new TodoNotFound({ id })
      return todo
    }),

  create: (input: CreateTodo) =>
    Effect.gen(function* () {
      const todos = yield* readTodos
      const todo: Todo = {
        id: crypto.randomUUID() as TodoId,
        title: input.title,
        completed: false,
      }
      yield* writeTodos([...todos, todo])
      return todo
    }),

  update: (id: TodoId, input: UpdateTodo) =>
    Effect.gen(function* () {
      const todos = yield* readTodos
      const index = todos.findIndex((t) => t.id === id)
      if (index === -1) return yield* new TodoNotFound({ id })
      const existing = todos[index]
      const updated: Todo = {
        id: existing.id,
        title: input.title ?? existing.title,
        completed: input.completed ?? existing.completed,
      }
      const next = [...todos]
      next[index] = updated
      yield* writeTodos(next)
      return updated
    }),

  remove: (id: TodoId) =>
    Effect.gen(function* () {
      const todos = yield* readTodos
      const filtered = todos.filter((t) => t.id !== id)
      if (filtered.length === todos.length) return yield* new TodoNotFound({ id })
      yield* writeTodos(filtered)
    }),
})
