"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Schema as S } from "effect"
import { composableFetcher } from "@darna-digital/composable-fetcher"
import {
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  type OrganizationId,
  type CreateOrganization,
  type UpdateOrganization,
} from "../../entity/organization.schema"

const QUERY_KEY = ["organizations"] as const

const organizationListSchema = S.standardSchemaV1(S.Array(OrganizationSchema))
const organizationSchema = S.standardSchemaV1(OrganizationSchema)
const createOrganizationSchema = S.standardSchemaV1(CreateOrganizationSchema)
const updateOrganizationSchema = S.standardSchemaV1(UpdateOrganizationSchema)
const deletedSchema = S.standardSchemaV1(S.Struct({ deleted: S.Boolean }))

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
        .schema(deletedSchema)
        .run("DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
