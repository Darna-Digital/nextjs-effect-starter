import { Schema as S } from "effect"
import { apiRoute } from "@/lib/http/api-route"
import {
  OrganizationId,
  UpdateOrganizationSchema,
} from "@/features/organization/entity/organization.schema"
import { organizationFunctions } from "@/features/organization/adapters/organization.api.adapter"

const Params = S.Struct({ id: OrganizationId })

export const GET = apiRoute({
  span: "GET /api/organizations/:id",
  params: Params,
  handle: ({ params }) => organizationFunctions.getById(params.id),
})

export const PUT = apiRoute({
  span: "PUT /api/organizations/:id",
  params: Params,
  body: UpdateOrganizationSchema,
  handle: ({ params, body }) =>
    organizationFunctions.update(params.id, body),
})

export const DELETE = apiRoute({
  span: "DELETE /api/organizations/:id",
  params: Params,
  status: 204,
  handle: ({ params }) => organizationFunctions.remove(params.id),
})
