"use client";

import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type { LoginInput, RegisterInput } from "@/lib/api/types";
import { useAuthContext } from "../auth.context";

/** Current user from context — no HTTP call. */
export function useCurrentUser() {
  const { user, isLoading } = useAuthContext();
  return { data: user, isLoading };
}

export function useRegister() {
  const { setUser } = useAuthContext();
  const mutation = $api.useMutation("post", "/api/auth/register", {
    onSuccess: (data) => setUser(data.user),
  });
  return {
    ...mutation,
    mutate: (body: RegisterInput) => mutation.mutate({ body }),
    mutateAsync: (body: RegisterInput) => mutation.mutateAsync({ body }),
  };
}

export function useLogin() {
  const { setUser } = useAuthContext();
  const mutation = $api.useMutation("post", "/api/auth/login", {
    onSuccess: (data) => setUser(data.user),
  });
  return {
    ...mutation,
    mutate: (body: LoginInput) => mutation.mutate({ body }),
    mutateAsync: (body: LoginInput) => mutation.mutateAsync({ body }),
  };
}

export function useLogout() {
  const { clearUser } = useAuthContext();
  const qc = useQueryClient();
  const mutation = $api.useMutation("post", "/api/auth/logout", {
    onSuccess: () => {
      clearUser();
      qc.clear();
    },
    onError: () => clearUser(),
  });
  type MutateOptions = Parameters<typeof mutation.mutate>[1];
  return {
    ...mutation,
    mutate: (_?: void, options?: MutateOptions) => mutation.mutate({}, options),
    mutateAsync: () => mutation.mutateAsync({}),
  };
}

export type AuthFieldError = {
  field: "email" | "password" | null;
  message: string;
};

const tagOf = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "_tag" in error
    ? String((error as { _tag: unknown })._tag)
    : undefined;

export function parseAuthError(error: unknown): AuthFieldError | null {
  if (!error) return null;
  switch (tagOf(error)) {
    case "EmailAlreadyTaken":
      return {
        field: "email",
        message: `${(error as { email: string }).email} is already registered.`,
      };
    case "InvalidCredentials":
      return { field: "password", message: "Invalid email or password." };
    case "NotAuthenticated":
      return {
        field: null,
        message: "You're signed out. Please log in again.",
      };
    case "RefreshTokenExpired":
      return { field: null, message: "Session expired. Please sign in again." };
    case "HttpApiDecodeError":
      return { field: "email", message: "Please check the form fields." };
    case "TooManyRequests":
      return {
        field: null,
        message: `Too many attempts — try again in ${(error as { retryAfter: number }).retryAfter}s.`,
      };
    case "TokenSigningFailed":
      return {
        field: null,
        message: "Session could not be created. Please try again.",
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
