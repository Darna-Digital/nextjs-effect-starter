"use client";

import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "@/lib/api/types";

const LIST_KEY = ["get", "/api/organizations"] as const;

export function useOrganizations() {
  return $api.useQuery("get", "/api/organizations");
}

export function useOrganization(id: Organization["id"]) {
  return $api.useQuery("get", "/api/organizations/{id}", {
    params: { path: { id } },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("post", "/api/organizations", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
  return {
    ...mutation,
    mutate: (body: CreateOrganizationInput) => mutation.mutate({ body }),
    mutateAsync: (body: CreateOrganizationInput) =>
      mutation.mutateAsync({ body }),
  };
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("put", "/api/organizations/{id}", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
  return {
    ...mutation,
    mutate: (vars: {
      id: Organization["id"];
      input: UpdateOrganizationInput;
    }) =>
      mutation.mutate({ params: { path: { id: vars.id } }, body: vars.input }),
    mutateAsync: (vars: {
      id: Organization["id"];
      input: UpdateOrganizationInput;
    }) =>
      mutation.mutateAsync({
        params: { path: { id: vars.id } },
        body: vars.input,
      }),
  };
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  const mutation = $api.useMutation("delete", "/api/organizations/{id}", {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
    onError: (error) => toastError(error),
  });
  return {
    ...mutation,
    mutate: (id: Organization["id"]) =>
      mutation.mutate({ params: { path: { id } } }),
    mutateAsync: (id: Organization["id"]) =>
      mutation.mutateAsync({ params: { path: { id } } }),
  };
}

function toastError(error: unknown) {
  const parsed = parseOrganizationError(error);
  if (parsed) window.alert(parsed.message);
}

export type OrganizationFieldError = {
  field: "name" | null;
  message: string;
};

const tagOf = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "_tag" in error
    ? String((error as { _tag: unknown })._tag)
    : undefined;

export function parseOrganizationError(
  error: unknown,
): OrganizationFieldError | null {
  if (!error) return null;
  switch (tagOf(error)) {
    case "OrganizationNameTaken":
      return {
        field: "name",
        message: `"${(error as { name: string }).name}" is already taken.`,
      };
    case "OrganizationNameReserved":
      return {
        field: "name",
        message: `"${(error as { name: string }).name}" is a reserved name.`,
      };
    case "HttpApiDecodeError":
      return { field: "name", message: "Please check the form fields." };
    case "OrganizationNotFound":
      return { field: null, message: "Organization not found." };
    case "OrganizationInUse":
      return {
        field: null,
        message:
          "Can't delete: this organization still has projects. Delete those first, then try again.",
      };
    case "TooManyRequests":
      return {
        field: null,
        message: `Too many requests — try again in ${(error as { retryAfter: number }).retryAfter}s.`,
      };
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
