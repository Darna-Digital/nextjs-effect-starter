import { Data, Schema as S } from "effect"

export const OrganizationId = S.String.pipe(S.brand("OrganizationId"))
export type OrganizationId = typeof OrganizationId.Type

/** Non-empty name after trimming. Exported for reuse by the request schemas. */
export const OrganizationName = S.Trim.pipe(S.minLength(1))

export const OrganizationSchema = S.Struct({
  id: OrganizationId,
  name: OrganizationName,
  description: S.optional(S.String),
})
export type Organization = typeof OrganizationSchema.Type

// ─────────────────────────────────────────────────────────────────────────────
// Domain errors
// ─────────────────────────────────────────────────────────────────────────────

export class OrganizationNotFound extends Data.TaggedError(
  "OrganizationNotFound",
)<{
  readonly id: OrganizationId
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Not found", id: this.id },
      { status: 404 },
    )
  }
}

export class OrganizationNameTaken extends Data.TaggedError(
  "OrganizationNameTaken",
)<{
  readonly name: string
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Name already taken", name: this.name },
      { status: 409 },
    )
  }
}

export class OrganizationNameReserved extends Data.TaggedError(
  "OrganizationNameReserved",
)<{
  readonly name: string
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Name is reserved", name: this.name },
      { status: 409 },
    )
  }
}
