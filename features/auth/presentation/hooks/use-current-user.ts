"use client";

import { useSession } from "@/features/auth/presentation/hooks/use-auth";

/**
 * Current authenticated user from the Better Auth session (via React Query).
 * Returns `{ data, isLoading }` where `data` is the user (or `null`).
 */
export function useCurrentUser() {
  const { data, isPending } = useSession();
  return { data: data?.user ?? null, isLoading: isPending };
}
