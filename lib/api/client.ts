"use client";

import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api-schema";

const baseUrl =
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;

/**
 * Typed fetch client for the Effect HTTP API. `credentials: "include"` sends the
 * Better Auth session cookie, which the API's `Authentication` middleware
 * validates. Session lifetime/refresh is handled entirely by Better Auth at
 * `/api/auth/*`, so no client-side token plumbing is needed here.
 */
export const fetchClient = createFetchClient<paths>({
  baseUrl,
  credentials: "include",
});

/** Typed React Query bindings derived from the generated OpenAPI schema. */
export const $api = createClient(fetchClient);
