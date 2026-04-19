import { Effect, Schema as S } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { requireUser } from "@/features/auth/auth.middleware"
import { OrganizationId } from "@/features/organization/organization.model"
import { UpdateOrganizationSchema } from "@/features/organization/organization.requests"
import { Organizations } from "@/features/organization/organization.service"

const Params = S.Struct({ id: OrganizationId })

export const GET = apiRoute({
  span: "GET /api/organizations/:id",
  params: Params,
  handle: ({ params }) =>
    Effect.gen(function* () {
      yield* requireUser
      return yield* Organizations.getById(params.id)
    }),
})

export const PUT = apiRoute({
  span: "PUT /api/organizations/:id",
  params: Params,
  body: UpdateOrganizationSchema,
  handle: ({ params, body }) =>
    Effect.gen(function* () {
      yield* requireUser
      return yield* Organizations.update(params.id, body)
    }),
})

export const DELETE = apiRoute({
  span: "DELETE /api/organizations/:id",
  params: Params,
  status: 204,
  handle: ({ params }) =>
    Effect.gen(function* () {
      yield* requireUser
      yield* Organizations.remove(params.id)
    }),
})
