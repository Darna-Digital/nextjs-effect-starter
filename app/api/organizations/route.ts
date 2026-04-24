import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { applyAuthMiddleware } from "@/features/auth/auth.http"
import { CreateOrganizationSchema } from "@/features/organization/schema/organization.schema.requests"
import { Organizations } from "@/features/organization/service/organization.service"

export const GET = apiRoute({
  span: "GET /api/organizations",
  handle: () =>
    Effect.gen(function* () {
      yield* applyAuthMiddleware
      return yield* Organizations.list()
    }),
})

export const POST = apiRoute({
  span: "POST /api/organizations",
  body: CreateOrganizationSchema,
  status: 201,
  handle: ({ body }) =>
    Effect.gen(function* () {
      yield* applyAuthMiddleware
      return yield* Organizations.create(body)
    }),
})
