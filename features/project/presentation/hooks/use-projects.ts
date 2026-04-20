"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Match, Schema as S } from "effect"
import { getFetchError } from "@darna-digital/composable-fetcher"
import { apiClient } from "@/features/auth/presentation/api-client"
import { ProjectSchema, type ProjectId } from "@/features/project/schema/project.schema.model"
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectApiErrorSchema,
  type CreateProject,
  type UpdateProject,
  type ProjectApiError,
} from "@/features/project/schema/project.schema.requests"

const QUERY_KEY = ["projects"] as const

const projectListSchema = S.standardSchemaV1(S.Array(ProjectSchema))
const projectSchema = S.standardSchemaV1(ProjectSchema)
const createProjectSchema = S.standardSchemaV1(CreateProjectSchema)
const updateProjectSchema = S.standardSchemaV1(UpdateProjectSchema)

const projectApiErrorSchema = S.standardSchemaV1(ProjectApiErrorSchema)

/**
 * Optional filter mirrors `ListProjectsQuerySchema` on the server. Passing
 * `{ ownerId: currentUser.id }` gives you "mine." Each field also accepts
 * `undefined` so the page can translate UI state → query shape without
 * stripping keys.
 */
export interface ProjectsFilter {
  ownerId?: string | undefined
  organizationId?: string | undefined
}

const buildProjectsUrl = (filter: ProjectsFilter) => {
  const qs = new URLSearchParams()
  if (filter.ownerId) qs.set("ownerId", filter.ownerId)
  if (filter.organizationId) qs.set("organizationId", filter.organizationId)
  const query = qs.toString()
  return query ? `/api/projects?${query}` : "/api/projects"
}

export function useProjects(filter: ProjectsFilter = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filter],
    queryFn: () =>
      apiClient
        .url(buildProjectsUrl(filter))
        .schema(projectListSchema)
        .run("GET"),
  })
}

export function useProject(id: ProjectId) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () =>
      apiClient
        .url(`/api/projects/${id}`)
        .schema(projectSchema)
        .errorSchema(projectApiErrorSchema)
        .run("GET"),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProject) =>
      apiClient
        .url("/api/projects")
        .input(createProjectSchema)
        .schema(projectSchema)
        .errorSchema(projectApiErrorSchema)
        .body(input)
        .run("POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: ProjectId; input: UpdateProject }) =>
      apiClient
        .url(`/api/projects/${id}`)
        .input(updateProjectSchema)
        .schema(projectSchema)
        .errorSchema(projectApiErrorSchema)
        .body(input)
        .run("PUT"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: ProjectId) =>
      apiClient
        .url(`/api/projects/${id}`)
        .errorSchema(projectApiErrorSchema)
        .run("DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export type ProjectFormError = {
  field: "organizationId" | null
  message: string
}

const matchApiError = Match.type<ProjectApiError>().pipe(
  Match.discriminator("error")("Not found", (e) => ({
    field: "organizationId" as const,
    message: `The selected organization (${e.id}) could not be found.`,
  })),
  Match.discriminator("error")("Validation failed", () => ({
    field: null,
    message: "Please check the form fields.",
  })),
  Match.discriminator("error")("Storage error", () => ({
    field: null,
    message: "Something went wrong on our side. Please try again.",
  })),
  Match.exhaustive,
)

export function parseProjectError(
  error: unknown,
): ProjectFormError | null {
  if (!error) return null

  const fe = getFetchError<ProjectApiError>(error)
  if (!fe) return { field: null, message: String(error) }

  if (fe.type === "http" && fe.data) return matchApiError(fe.data)

  if (fe.type === "network") {
    return { field: null, message: "Network error. Check your connection." }
  }

  return { field: null, message: fe.message }
}
