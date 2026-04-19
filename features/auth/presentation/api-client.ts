"use client"

import { createComposableFetcher, toError } from "@darna-digital/composable-fetcher"

/**
 * Callback invoked when a request (or its refresh attempt) fails auth and
 * the server has cleared the session cookies. The `AuthProvider` registers
 * a handler here that clears its React user state.
 */
type UnauthenticatedHandler = () => void
let onUnauthenticated: UnauthenticatedHandler = () => {}

export const registerUnauthenticatedHandler = (fn: UnauthenticatedHandler) => {
  onUnauthenticated = fn
}

/**
 * The one app-wide API client. All hooks use this. It:
 *
 *  - Sends cookies on every request (`credentials: "include"`) so the
 *    server sees the `access_token` cookie automatically.
 *  - On 401, calls `POST /api/auth/refresh` once. If it succeeds, the
 *    server has set fresh cookies and we retry the original request. If
 *    it fails, we notify the auth context and rethrow.
 *
 * Rotation and token storage are entirely server-side. Every other error
 * (4xx/5xx, network, parse) is rethrown so callers' `onError` handlers
 * still fire.
 */
export const apiClient = createComposableFetcher({
  credentials: "include",
  catch: async ({ error, retry }) => {
    // Pass-through: only 401s get the refresh treatment; everything else
    // must propagate so React Query / useMutation onError still runs.
    if (error.type !== "http" || error.status !== 401) {
      throw toError(error)
    }

    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).catch(() => null)

    if (!refreshRes?.ok) {
      onUnauthenticated()
      throw toError(error)
    }

    return retry()
  },
})
