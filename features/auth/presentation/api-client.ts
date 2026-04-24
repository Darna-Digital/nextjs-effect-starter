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

export const apiClient = createComposableFetcher({
  credentials: "include",
  catch: async ({ error, retry }) => {
    if (error.type !== "http" || error.status !== 401) {
      throw toError(error);
    }

    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    if (!refreshRes?.ok) {
      onUnauthenticated();
      throw toError(error);
    }

    return retry();
  },
});
