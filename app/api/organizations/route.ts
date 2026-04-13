import { Effect, Schema } from "effect"
import { CreateOrganizationSchema } from "@/features/organization/entity/organization.schema"
import {
  organizationFunctions,
  provideAndRun,
} from "@/features/organization/adapters/organization.api.adapter"

export async function GET() {
  return provideAndRun(
    Effect.gen(function* () {
      const organizations = yield* organizationFunctions.getAll()
      return Response.json(organizations)
    }).pipe(Effect.withSpan("GET /api/organizations")),
  )
}

export async function POST(request: Request) {
  const body = await request.json()

  return provideAndRun(
    Effect.gen(function* () {
      const input = yield* Schema.decode(CreateOrganizationSchema)(body)
      const organization = yield* organizationFunctions.create(input)
      return Response.json(organization, { status: 201 })
    }).pipe(Effect.withSpan("POST /api/organizations")),
  )
}
