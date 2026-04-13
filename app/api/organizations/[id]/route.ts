import { Effect, Schema } from "effect"
import {
  UpdateOrganizationSchema,
  type OrganizationId,
} from "@/features/organization/entity/organization.schema"
import {
  organizationFunctions,
  provideAndRun,
} from "@/features/organization/adapters/organization.api.adapter"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      const organization = yield* organizationFunctions.getById(
        id as OrganizationId,
      )
      return Response.json(organization)
    }).pipe(
      Effect.withSpan("GET /api/organizations/:id", { attributes: { id } }),
    ),
  )
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      const input = yield* Schema.decode(UpdateOrganizationSchema)(body)
      const organization = yield* organizationFunctions.update(
        id as OrganizationId,
        input,
      )
      return Response.json(organization)
    }).pipe(
      Effect.withSpan("PUT /api/organizations/:id", { attributes: { id } }),
    ),
  )
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params

  return provideAndRun(
    Effect.gen(function* () {
      yield* organizationFunctions.remove(id as OrganizationId)
      return Response.json({ deleted: true })
    }).pipe(
      Effect.withSpan("DELETE /api/organizations/:id", { attributes: { id } }),
    ),
  )
}
