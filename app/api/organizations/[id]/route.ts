import { Schema as S } from "effect";
import { apiRoute } from "@/lib/http/api-route";
import { OrganizationId } from "@/features/organization/organization.model";
import { UpdateOrganizationSchema } from "@/features/organization/organization.requests";
import { Organizations } from "@/features/organization/organization.service";

const Params = S.Struct({ id: OrganizationId });

export const GET = apiRoute({
  span: "GET /api/organizations/:id",
  params: Params,
  handle: ({ params }) => Organizations.getById(params.id),
});

export const PUT = apiRoute({
  span: "PUT /api/organizations/:id",
  params: Params,
  body: UpdateOrganizationSchema,
  handle: ({ params, body }) => Organizations.update(params.id, body),
});

export const DELETE = apiRoute({
  span: "DELETE /api/organizations/:id",
  params: Params,
  status: 204,
  handle: ({ params }) => Organizations.remove(params.id),
});
