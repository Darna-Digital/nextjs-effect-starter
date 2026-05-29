"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";

/**
 * React Query bindings for Better Auth. Types are inferred from the Better Auth
 * client (`authClient`) — no codegen — so requests/responses stay in sync with
 * the server config. The reactive session lives in one query (`SESSION_KEY`)
 * that auth mutations invalidate, so the nav/pages update after sign-in/out.
 */
export const SESSION_KEY = ["auth", "session"] as const;

/** Shape of a Better Auth client error (`{ data, error }` envelopes). */
export type AuthError = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

/**
 * Throw the Better Auth error envelope so React Query treats it as a failure.
 * The param type mirrors Better Auth's `{ data, error }` union loosely (its
 * `error.code` is optional), so any client method's result is accepted.
 */
async function unwrap<T>(
  promise: Promise<{ data: T | null; error: unknown }>,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => unwrap(authClient.getSession()),
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      unwrap(authClient.signIn.email(vars)),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: (vars: {
      name: string;
      email: string;
      password: string;
      callbackURL?: string;
    }) => unwrap(authClient.signUp.email(vars)),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(authClient.signOut()),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (vars: { email: string; redirectTo: string }) =>
      unwrap(authClient.requestPasswordReset(vars)),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (vars: { newPassword: string; token: string }) =>
      unwrap(authClient.resetPassword(vars)),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (vars: { email: string; callbackURL?: string }) =>
      unwrap(authClient.sendVerificationEmail(vars)),
  });
}
