"use client";

import { useSession } from "@/lib/auth/auth-client";

/**
 * Current authenticated user from the Better Auth session. Drop-in replacement
 * for the former custom hook: returns `{ data, isLoading }` where `data` is the
 * user (or `null`).
 */
export function useCurrentUser() {
  const { data, isPending } = useSession();
  return { data: data?.user ?? null, isLoading: isPending };
}
