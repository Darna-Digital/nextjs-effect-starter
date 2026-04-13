"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  Organization,
  CreateOrganization,
  UpdateOrganization,
  OrganizationId,
} from "../../entity/organization.schema"

const QUERY_KEY = ["organizations"] as const

async function fetchOrganizations(): Promise<Organization[]> {
  const res = await fetch("/api/organizations")
  if (!res.ok) throw new Error("Failed to fetch organizations")
  return res.json()
}

async function fetchOrganization(id: OrganizationId): Promise<Organization> {
  const res = await fetch(`/api/organizations/${id}`)
  if (!res.ok) throw new Error("Failed to fetch organization")
  return res.json()
}

async function createOrganization(
  input: CreateOrganization,
): Promise<Organization> {
  const res = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create organization")
  return res.json()
}

async function updateOrganization({
  id,
  input,
}: {
  id: OrganizationId
  input: UpdateOrganization
}): Promise<Organization> {
  const res = await fetch(`/api/organizations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to update organization")
  return res.json()
}

async function deleteOrganization(id: OrganizationId): Promise<void> {
  const res = await fetch(`/api/organizations/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete organization")
}

export function useOrganizations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchOrganizations,
  })
}

export function useOrganization(id: OrganizationId) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => fetchOrganization(id),
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
