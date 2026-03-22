import { Effect, Exit, Schema } from "effect"
import { TodoRepo } from "@/lib/TodoRepo"
import { TodoId, UpdateTodo } from "@/lib/Todo"
import { provideAndRun } from "@/lib/runEffect"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/todos/:id
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  const program = Effect.gen(function* () {
    const repo = yield* TodoRepo
    return yield* repo.getById(id as TodoId)
  })

  const exit = await provideAndRun(program)

  if (Exit.isSuccess(exit)) {
    if (exit.value === null) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    return Response.json(exit.value)
  }
  return Response.json({ error: "Server error" }, { status: 500 })
}

// PUT /api/todos/:id
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()

  const program = Effect.gen(function* () {
    const input = yield* Schema.decode(UpdateTodo)(body)
    const repo = yield* TodoRepo
    return yield* repo.update(id as TodoId, input)
  })

  const exit = await provideAndRun(program)

  if (Exit.isSuccess(exit)) {
    if (exit.value === null) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    return Response.json(exit.value)
  }
  return Response.json({ error: "Invalid input" }, { status: 400 })
}

// DELETE /api/todos/:id
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params

  const program = Effect.gen(function* () {
    const repo = yield* TodoRepo
    return yield* repo.remove(id as TodoId)
  })

  const exit = await provideAndRun(program)

  if (Exit.isSuccess(exit)) {
    if (!exit.value) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    return Response.json({ deleted: true })
  }
  return Response.json({ error: "Server error" }, { status: 500 })
}
