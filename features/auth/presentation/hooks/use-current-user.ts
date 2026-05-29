"use client";

import { useSession } from "@/features/auth/presentation/hooks/use-auth";

export function useCurrentUser() {
  const { data, isPending } = useSession();
  return { data: data?.user ?? null, isLoading: isPending };
}
