import { apiRoute } from "@/lib/http/api-route"
import { CreateOrganizationSchema } from "@/features/organization/entity/organization.schema"
import { organizationFunctions } from "@/features/organization/adapters/organization.api.adapter"

export const GET = apiRoute({
  span: "GET /api/organizations",
  handle: () => organizationFunctions.getAll(),
})

export const POST = apiRoute({
  span: "POST /api/organizations",
  body: CreateOrganizationSchema,
  status: 201,
  handle: ({ body }) => organizationFunctions.create(body),
})
