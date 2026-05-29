import { Schema as S } from "effect";

export const OrganizationId = S.String.pipe(S.brand("OrganizationId"));
export type OrganizationId = typeof OrganizationId.Type;

export const OrganizationName = S.Trim.pipe(S.check(S.isMinLength(1)));

export const OrganizationSchema = S.Struct({
  id: OrganizationId,
  name: OrganizationName,
  description: S.optional(S.String),
});
export type Organization = typeof OrganizationSchema.Type;

export class OrganizationNotFound extends S.TaggedErrorClass<OrganizationNotFound>()(
  "OrganizationNotFound",
  { id: OrganizationId },
  { httpApiStatus: 404 },
) {}

export class OrganizationNameTaken extends S.TaggedErrorClass<OrganizationNameTaken>()(
  "OrganizationNameTaken",
  { name: S.String },
  { httpApiStatus: 409 },
) {}

export class OrganizationNameReserved extends S.TaggedErrorClass<OrganizationNameReserved>()(
  "OrganizationNameReserved",
  { name: S.String },
  { httpApiStatus: 409 },
) {}

export class OrganizationInUse extends S.TaggedErrorClass<OrganizationInUse>()(
  "OrganizationInUse",
  { id: OrganizationId },
  { httpApiStatus: 409 },
) {}
