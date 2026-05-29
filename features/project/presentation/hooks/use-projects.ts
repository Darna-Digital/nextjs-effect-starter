"use client";

import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/lib/api/types";

const LIST_KEY = ["get", "/api/projects"] as const;

export type ProjectsFilter = {
  ownerId?: string | undefined;
  organizationId?: string | undefined;
};

export function useProjects(filter: ProjectsFilter = {}) {
  // Build the query object conditionally so optional keys are simply absent
  // (rather than `key: undefined`, which `exactOptionalPropertyTypes` rejects).
  const query: { ownerId?: string; organizationId?: string } = {};
  if (filter.ownerId) query.ownerId = filter.ownerId;
  if (filter.organizationId) query.organizationId = filter.organizationId;
  return $api.useQuery("get", "/api/projects", { params: { query } });
}

export function useProject(id: Project["id"]) {
  return $api.useQuery("get", "/api/projects/{id}", {
    params: { path: { id } },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("post", "/api/projects", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
  return {
    ...mutation,
    mutate: (body: CreateProjectInput) => mutation.mutate({ body }),
    mutateAsync: (body: CreateProjectInput) => mutation.mutateAsync({ body }),
  };
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("put", "/api/projects/{id}", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
  return {
    ...mutation,
    mutate: (vars: { id: Project["id"]; input: UpdateProjectInput }) =>
      mutation.mutate({ params: { path: { id: vars.id } }, body: vars.input }),
    mutateAsync: (vars: { id: Project["id"]; input: UpdateProjectInput }) =>
      mutation.mutateAsync({
        params: { path: { id: vars.id } },
        body: vars.input,
      }),
  };
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("delete", "/api/projects/{id}", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
  return {
    ...mutation,
    mutate: (id: Project["id"]) =>
      mutation.mutate({ params: { path: { id } } }),
    mutateAsync: (id: Project["id"]) =>
      mutation.mutateAsync({ params: { path: { id } } }),
  };
}

export type ProjectFormError = {
  field: "organizationId" | null;
  message: string;
};

const tagOf = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "_tag" in error
    ? String((error as { _tag: unknown })._tag)
    : undefined;

export function parseProjectError(error: unknown): ProjectFormError | null {
  if (!error) return null;
  switch (tagOf(error)) {
    case "OrganizationNotFound":
      return {
        field: "organizationId",
        message: `The selected organization (${(error as { id: string }).id}) could not be found.`,
      };
    case "ProjectNotFound":
      return { field: null, message: "Project not found." };
    case "HttpApiDecodeError":
      return { field: null, message: "Please check the form fields." };
    case "StorageError":
      return {
        field: null,
        message: "Something went wrong on our side. Please try again.",
      };
    default:
      return {
        field: null,
        message:
          error instanceof Error
            ? error.message
            : "Network error. Check your connection.",
      };
  }
}
