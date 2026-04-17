import { apiRoute } from "@/lib/http/api-route"
import { CreateOrganizationSchema } from "@/features/organization/entity/organization.schema"
import { Organizations } from "@/features/organization/service"

export const GET = apiRoute({
  span: "GET /api/organizations",
  handle: () => Organizations.getAll(),
})

export const POST = apiRoute({
  span: "POST /api/organizations",
  body: CreateOrganizationSchema,
  status: 201,
  handle: ({ body }) => Organizations.create(body),
})
