import { Effect, Schema } from "effect"
import { TodoRepo } from "@/lib/TodoRepo"
import { TodoId, UpdateTodo } from "@/lib/Todo"
import { provideAndRun } from "@/lib/runEffect"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/todos/:id
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      const repo = yield* TodoRepo
      // If the todo doesn't exist, this yields a TodoNotFound error.
      // It short-circuits the generator (like a thrown exception)
      // but it's tracked in the type — provideAndRun handles it.
      const todo = yield* repo.getById(id as TodoId)
      return Response.json(todo)
    }),
  )
}

// PUT /api/todos/:id
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      const input = yield* Schema.decode(UpdateTodo)(body)
      const repo = yield* TodoRepo
      const todo = yield* repo.update(id as TodoId, input)
      return Response.json(todo)
    }),
  )
}

// DELETE /api/todos/:id
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      const repo = yield* TodoRepo
      yield* repo.remove(id as TodoId)
      return Response.json({ deleted: true })
    }),
  )
}
