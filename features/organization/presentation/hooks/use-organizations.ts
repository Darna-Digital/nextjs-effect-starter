"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Match, Schema as S } from "effect"
import {
  composableFetcher,
  getFetchError,
} from "@darna-digital/composable-fetcher"
import {
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationApiErrorSchema,
  type OrganizationApiError,
  type OrganizationId,
  type CreateOrganization,
  type UpdateOrganization,
} from "../../organization.schema"

const QUERY_KEY = ["organizations"] as const

const organizationListSchema = S.standardSchemaV1(S.Array(OrganizationSchema))
const organizationSchema = S.standardSchemaV1(OrganizationSchema)
const createOrganizationSchema = S.standardSchemaV1(CreateOrganizationSchema)
const updateOrganizationSchema = S.standardSchemaV1(UpdateOrganizationSchema)
const organizationApiErrorSchema = S.standardSchemaV1(
  OrganizationApiErrorSchema,
)

export function useOrganizations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      composableFetcher
        .url("/api/organizations")
        .schema(organizationListSchema)
        .run("GET"),
  })
}

export function useOrganization(id: OrganizationId) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () =>
      composableFetcher
        .url(`/api/organizations/${id}`)
        .schema(organizationSchema)
        .errorSchema(organizationApiErrorSchema)
        .run("GET"),
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganization) =>
      composableFetcher
        .url("/api/organizations")
        .input(createOrganizationSchema)
        .schema(organizationSchema)
        .errorSchema(organizationApiErrorSchema)
        .body(input)
        .run("POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: OrganizationId
      input: UpdateOrganization
    }) =>
      composableFetcher
        .url(`/api/organizations/${id}`)
        .input(updateOrganizationSchema)
        .schema(organizationSchema)
        .errorSchema(organizationApiErrorSchema)
        .body(input)
        .run("PUT"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: OrganizationId) =>
      composableFetcher
        .url(`/api/organizations/${id}`)
        .errorSchema(organizationApiErrorSchema)
        .run("DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

/**
 * Classifies an error thrown by an organization mutation/query into
 * something the form can render directly:
 *  - `field: "name"` → message belongs under the name input
 *  - `field: null`   → show as a general banner
 */
export type OrganizationFieldError = {
  field: "name" | null
  message: string
}

/**
 * Exhaustive match over the API error union. Adding a new member to
 * `OrganizationApiErrorSchema` without handling it here is a type error.
 */
const matchApiError = Match.type<OrganizationApiError>().pipe(
  Match.discriminator("error")("Name already taken", (e) => ({
    field: "name" as const,
    message: `"${e.name}" is already taken.`,
  })),
  Match.discriminator("error")("Name is reserved", (e) => ({
    field: "name" as const,
    message: `"${e.name}" is a reserved name.`,
  })),
  Match.discriminator("error")("Validation failed", () => ({
    field: "name" as const,
    message: "Please check the form fields.",
  })),
  Match.discriminator("error")("Not found", () => ({
    field: null,
    message: "Organization not found.",
  })),
  Match.discriminator("error")("Storage error", () => ({
    field: null,
    message: "Something went wrong on our side. Please try again.",
  })),
  Match.exhaustive,
)

export function parseOrganizationError(
  error: unknown,
): OrganizationFieldError | null {
  if (!error) return null

  const fe = getFetchError<OrganizationApiError>(error)
  if (!fe) return { field: null, message: String(error) }

  if (fe.type === "http" && fe.data) return matchApiError(fe.data)

  if (fe.type === "network") {
    return { field: null, message: "Network error. Check your connection." }
  }

  return { field: null, message: fe.message }
}
