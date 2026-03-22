import { Effect, Schema } from "effect"
import { TodoRepo } from "@/lib/TodoRepo"
import { CreateTodo } from "@/lib/Todo"
import { provideAndRun } from "@/lib/runEffect"

// GET /api/todos — list all todos
export async function GET() {
  return provideAndRun(
    Effect.gen(function* () {
      const repo = yield* TodoRepo
      const todos = yield* repo.getAll
      return Response.json(todos)
    }),
  )
}

// POST /api/todos — create a new todo
export async function POST(request: Request) {
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      // Schema.decode returns Effect<A, ParseError> —
      // the ParseError flows into the typed error channel
      // and gets caught by catchTags in provideAndRun.
      const input = yield* Schema.decode(CreateTodo)(body)
      const repo = yield* TodoRepo
      const todo = yield* repo.create(input)
      return Response.json(todo, { status: 201 })
    }),
  )
}
