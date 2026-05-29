import { Schema as S } from "effect";
import { HttpApiSchema } from "@effect/platform";

export const OrganizationId = S.String.pipe(S.brand("OrganizationId"));
export type OrganizationId = typeof OrganizationId.Type;

export const OrganizationName = S.Trim.pipe(S.minLength(1));

export const OrganizationSchema = S.Struct({
  id: OrganizationId,
  name: OrganizationName,
  description: S.optional(S.String),
});
export type Organization = typeof OrganizationSchema.Type;

export class OrganizationNotFound extends S.TaggedError<OrganizationNotFound>()(
  "OrganizationNotFound",
  { id: OrganizationId },
  HttpApiSchema.annotations({ status: 404 }),
) {}

export class OrganizationNameTaken extends S.TaggedError<OrganizationNameTaken>()(
  "OrganizationNameTaken",
  { name: S.String },
  HttpApiSchema.annotations({ status: 409 }),
) {}

export class OrganizationNameReserved extends S.TaggedError<OrganizationNameReserved>()(
  "OrganizationNameReserved",
  { name: S.String },
  HttpApiSchema.annotations({ status: 409 }),
) {}

export class OrganizationInUse extends S.TaggedError<OrganizationInUse>()(
  "OrganizationInUse",
  { id: OrganizationId },
  HttpApiSchema.annotations({ status: 409 }),
) {}
