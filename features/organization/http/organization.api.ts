import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema as S } from "effect";
import { StorageError } from "@/lib/effect/layers/storage";
import { Authentication } from "@/features/auth/http/auth.middleware";
import {
  OrganizationId,
  OrganizationInUse,
  OrganizationNameReserved,
  OrganizationNameTaken,
  OrganizationNotFound,
  OrganizationSchema,
} from "@/features/organization/schema/organization.schema.model";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from "@/features/organization/schema/organization.schema.requests";

const IdParam = S.Struct({ id: OrganizationId });

export class OrganizationApi extends HttpApiGroup.make("organizations")
  .add(
    HttpApiEndpoint.get("list", "/organizations")
      .addSuccess(S.Array(OrganizationSchema))
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.post("create", "/organizations")
      .setPayload(CreateOrganizationSchema)
      .addSuccess(OrganizationSchema, { status: 201 })
      .addError(OrganizationNameTaken)
      .addError(OrganizationNameReserved)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.get("getById", "/organizations/:id")
      .setPath(IdParam)
      .addSuccess(OrganizationSchema)
      .addError(OrganizationNotFound)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.put("update", "/organizations/:id")
      .setPath(IdParam)
      .setPayload(UpdateOrganizationSchema)
      .addSuccess(OrganizationSchema)
      .addError(OrganizationNotFound)
      .addError(OrganizationNameTaken)
      .addError(OrganizationNameReserved)
      .addError(StorageError),
  )
  .add(
    HttpApiEndpoint.del("remove", "/organizations/:id")
      .setPath(IdParam)
      .addSuccess(HttpApiSchema.NoContent)
      .addError(OrganizationNotFound)
      .addError(OrganizationInUse)
      .addError(StorageError),
  )
  .middleware(Authentication) {}
