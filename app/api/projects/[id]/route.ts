import { Effect, Schema as S } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { applyAuthMiddleware } from "@/features/auth/auth.http"
import { ProjectId } from "@/features/project/schema/project.schema.model"
import { UpdateProjectSchema } from "@/features/project/schema/project.schema.requests"
import { Projects } from "@/features/project/service/project.service"

const Params = S.Struct({ id: ProjectId })

export const GET = apiRoute({
  span: "GET /api/projects/:id",
  params: Params,
  handle: ({ params }) =>
    Effect.gen(function* () {
      yield* applyAuthMiddleware
      return yield* Projects.getById(params.id)
    }),
})

export const PUT = apiRoute({
  span: "PUT /api/projects/:id",
  params: Params,
  body: UpdateProjectSchema,
  handle: ({ params, body }) =>
    Effect.gen(function* () {
      yield* applyAuthMiddleware
      return yield* Projects.update(params.id, body)
    }),
})

export const DELETE = apiRoute({
  span: "DELETE /api/projects/:id",
  params: Params,
  status: 204,
  handle: ({ params }) =>
    Effect.gen(function* () {
      yield* applyAuthMiddleware
      yield* Projects.remove(params.id)
    }),
})
