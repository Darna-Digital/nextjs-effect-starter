import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { requireUser } from "@/features/auth/auth.middleware"
import { CreateProjectSchema } from "@/features/project/project.requests"
import { Projects } from "@/features/project/project.service"

export const GET = apiRoute({
  span: "GET /api/projects",
  handle: () =>
    Effect.gen(function* () {
      yield* requireUser
      return yield* Projects.getAll()
    }),
})

export const POST = apiRoute({
  span: "POST /api/projects",
  body: CreateProjectSchema,
  status: 201,
  handle: ({ body }) =>
    Effect.gen(function* () {
      yield* requireUser
      return yield* Projects.create(body)
    }),
})
