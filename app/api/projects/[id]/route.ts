import { Effect, Schema } from "effect"
import {
  UpdateProjectSchema,
  type ProjectId,
} from "@/features/project/entity/project.schema"
import {
  projectFunctions,
  provideAndRun,
} from "@/features/project/adapters/project.api.adapter"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      const project = yield* projectFunctions.getById(id as ProjectId)
      return Response.json(project)
    }),
  )
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      const input = yield* Schema.decode(UpdateProjectSchema)(body)
      const project = yield* projectFunctions.update(id as ProjectId, input)
      return Response.json(project)
    }),
  )
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      yield* projectFunctions.remove(id as ProjectId)
      return Response.json({ deleted: true })
    }),
  )
}
