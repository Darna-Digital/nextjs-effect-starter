import { Effect, Exit, Schema } from "effect"
import { TodoRepo } from "@/lib/TodoRepo"
import { CreateTodo } from "@/lib/Todo"
import { provideAndRun } from "@/lib/runEffect"

// GET /api/todos — list all todos
export async function GET() {
  // Effect.gen is a generator-based syntax for chaining effects.
  // yield* unwraps each Effect, similar to await for Promises.
  // The key difference: the type system tracks errors AND dependencies.
  const program = Effect.gen(function* () {
    const repo = yield* TodoRepo
    return yield* repo.getAll
  })

  const exit = await provideAndRun(program)

  if (Exit.isSuccess(exit)) {
    return Response.json(exit.value)
  }
  return Response.json({ error: "Failed to fetch todos" }, { status: 500 })
}

// POST /api/todos — create a new todo
export async function POST(request: Request) {
  const body = await request.json()

  // Schema.decode validates + transforms data, returning an Effect.
  // If validation fails, it produces a structured ParseError (not a thrown exception).
  const program = Effect.gen(function* () {
    const input = yield* Schema.decode(CreateTodo)(body)
    const repo = yield* TodoRepo
    return yield* repo.create(input)
  })

  const exit = await provideAndRun(program)

  if (Exit.isSuccess(exit)) {
    return Response.json(exit.value, { status: 201 })
  }
  return Response.json({ error: "Invalid input" }, { status: 400 })
}
