import { Effect, Schema } from "effect"
import { CreateProjectSchema } from "@/features/project/entity/project.schema"
import {
  projectFunctions,
  provideAndRun,
} from "@/features/project/adapters/project.api.adapter"

export async function GET() {
  return provideAndRun(
    Effect.gen(function* () {
      const projects = yield* projectFunctions.getAll()
      return Response.json(projects)
    }).pipe(Effect.withSpan("GET /api/projects")),
  )
}

export async function POST(request: Request) {
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      const input = yield* Schema.decode(CreateProjectSchema)(body)
      const project = yield* projectFunctions.create(input)
      return Response.json(project, { status: 201 })
    }).pipe(Effect.withSpan("POST /api/projects")),
  )
}
