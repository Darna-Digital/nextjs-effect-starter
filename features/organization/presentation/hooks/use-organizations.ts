"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match, Schema as S } from "effect";
import {
  composableFetcher,
  getFetchError,
  type FetcherThrownError,
} from "@darna-digital/composable-fetcher";
import {
  OrganizationSchema,
  type OrganizationId,
} from "../../organization.model";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationApiErrorSchema,
  type OrganizationApiError,
  type CreateOrganization,
  type UpdateOrganization,
} from "../../organization.requests";

const QUERY_KEY = ["organizations"] as const;

const organizationListSchema = S.standardSchemaV1(S.Array(OrganizationSchema));
const organizationSchema = S.standardSchemaV1(OrganizationSchema);
const createOrganizationSchema = S.standardSchemaV1(CreateOrganizationSchema);
const updateOrganizationSchema = S.standardSchemaV1(UpdateOrganizationSchema);
const organizationApiErrorSchema = S.standardSchemaV1(
  OrganizationApiErrorSchema,
);

/** The typed shape composable-fetcher throws when an HTTP error matches the schema. */
type OrganizationThrownError = FetcherThrownError<OrganizationApiError>;

export function useOrganizations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      composableFetcher
        .url("/api/organizations")
        .schema(organizationListSchema)
        .run("GET"),
  });
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
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<unknown, OrganizationThrownError, CreateOrganization>({
    mutationFn: (input) =>
      composableFetcher
        .url("/api/organizations")
        .input(createOrganizationSchema)
        .schema(organizationSchema)
        .errorSchema(organizationApiErrorSchema)
        .body(input)
        .run("POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    OrganizationThrownError,
    { id: OrganizationId; input: UpdateOrganization }
  >({
    mutationFn: ({ id, input }) =>
      composableFetcher
        .url(`/api/organizations/${id}`)
        .input(updateOrganizationSchema)
        .schema(organizationSchema)
        .errorSchema(organizationApiErrorSchema)
        .body(input)
        .run("PUT"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, OrganizationThrownError, OrganizationId>({
    mutationFn: (id) =>
      composableFetcher
        .url(`/api/organizations/${id}`)
        .errorSchema(organizationApiErrorSchema)
        .run("DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (error) => toastError(error),
  });
}

/**
 * Centralized toast-on-error for organization mutations.
 * Swap `window.alert` for a real toast library later — one change here
 * updates every hook that opts in.
 *
 * Not used by `useCreate…` / `useUpdate…` because those errors are
 * rendered inline by the form (`submitError` prop). Toasting in addition
 * would double up.
 */
const toastError = (error: OrganizationThrownError) => {
  const parsed = parseOrganizationError(error);
  if (parsed) window.alert(parsed.message);
};

/**
 * Classifies an error thrown by an organization mutation/query into
 * something the form can render directly:
 *  - `field: "name"` → message belongs under the name input
 *  - `field: null`   → show as a general banner
 */
export type OrganizationFieldError = {
  field: "name" | null;
  message: string;
};

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
  Match.discriminator("error")("Organization has dependent projects", () => ({
    field: null,
    message:
      "Can't delete: this organization still has projects. Delete those first, then try again.",
  })),
  Match.discriminator("error")("Storage error", () => ({
    field: null,
    message: "Something went wrong on our side. Please try again.",
  })),
  Match.exhaustive,
);

export function parseOrganizationError(
  error: unknown,
): OrganizationFieldError | null {
  if (!error) return null;

  const fe = getFetchError<OrganizationApiError>(error);
  if (!fe) return { field: null, message: String(error) };

  if (fe.type === "http" && fe.data) return matchApiError(fe.data);

  if (fe.type === "network") {
    return { field: null, message: "Network error. Check your connection." };
  }

  return { field: null, message: fe.message };
}
