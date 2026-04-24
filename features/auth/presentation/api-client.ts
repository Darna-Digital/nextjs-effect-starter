"use client";

import {
  createComposableFetcher,
  toError,
} from "@darna-digital/composable-fetcher";

type UnauthenticatedHandler = () => void;
let onUnauthenticated: UnauthenticatedHandler = () => {};

export const registerUnauthenticatedHandler = (fn: UnauthenticatedHandler) => {
  onUnauthenticated = fn;
};

let inFlightRefresh: Promise<boolean> | null = null;

function refreshSession() {
  inFlightRefresh ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      inFlightRefresh = null;
    });
  return inFlightRefresh;
}

export const apiClient = createComposableFetcher({
  credentials: "include",
  catch: async ({ error, retry }) => {
    if (error.type !== "http" || error.status !== 401) {
      throw toError(error);
    }

    const refreshed = await refreshSession();

    if (!refreshed) {
      onUnauthenticated();
      throw toError(error);
    }

    return retry();
  },
});
