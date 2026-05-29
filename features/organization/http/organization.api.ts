import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
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
    HttpApiEndpoint.get("list", "/organizations", {
      success: S.Array(OrganizationSchema),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/organizations", {
      payload: CreateOrganizationSchema,
      success: OrganizationSchema.pipe(HttpApiSchema.status(201)),
      error: [OrganizationNameTaken, OrganizationNameReserved, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.get("getById", "/organizations/:id", {
      params: IdParam,
      success: OrganizationSchema,
      error: [OrganizationNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/organizations/:id", {
      params: IdParam,
      payload: UpdateOrganizationSchema,
      success: OrganizationSchema,
      error: [
        OrganizationNotFound,
        OrganizationNameTaken,
        OrganizationNameReserved,
        StorageError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.delete("remove", "/organizations/:id", {
      params: IdParam,
      success: HttpApiSchema.NoContent,
      error: [OrganizationNotFound, OrganizationInUse, StorageError],
    }),
  )
  .middleware(Authentication) {}
