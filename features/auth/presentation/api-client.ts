"use client"

import { createComposableFetcher } from "@darna-digital/composable-fetcher"

/**
 * Callback invoked when a request (or its refresh attempt) fails auth and
 * the server has cleared the session cookies. The `AuthProvider` registers
 * a callback here that clears its React user state.
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
 *    it fails, we notify the auth context to clear user state.
 *
 * Rotation and token storage are entirely server-side. The client never
 * sees or handles a JWT — it just reacts to 401s.
 */
export const apiClient = createComposableFetcher({
  credentials: "include",
  catch: async ({ error, retry }) => {
    if (error.type !== "http" || error.status !== 401) return

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        onUnauthenticated()
        return
      }
      return retry()
    } catch {
      onUnauthenticated()
    }
  },
})
