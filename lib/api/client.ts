"use client";

import createFetchClient, { type Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api-schema";

const baseUrl =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;

const REFRESH_PATH = "/api/auth/refresh";

let onUnauthenticated: () => void = () => {};

/** Register a callback invoked when a request ultimately fails as 401. */
export const registerUnauthenticatedHandler = (fn: () => void) => {
  onUnauthenticated = fn;
};

// Coalesce concurrent refreshes into one in-flight request.
let inFlightRefresh: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  inFlightRefresh ??= fetch(`${baseUrl}${REFRESH_PATH}`, {
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

// Keep an un-consumed clone of each request so we can replay it after a refresh.
const requestClones = new WeakMap<Request, Request>();

const authRefreshMiddleware: Middleware = {
  onRequest({ request }) {
    requestClones.set(request, request.clone());
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) return undefined;
    if (new URL(request.url).pathname.endsWith(REFRESH_PATH)) return undefined;

    const refreshed = await refreshSession();
    if (!refreshed) {
      onUnauthenticated();
      return undefined;
    }

    const replay = requestClones.get(request);
    return replay ? fetch(replay) : undefined;
  },
};

export const fetchClient = createFetchClient<paths>({
  baseUrl,
  credentials: "include",
});
fetchClient.use(authRefreshMiddleware);

/** Typed React Query bindings derived from the generated OpenAPI schema. */
export const $api = createClient(fetchClient);
