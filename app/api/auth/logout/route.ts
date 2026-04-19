import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/auth.service"
import { clearAuthCookies, getRefreshCookie } from "@/features/auth/auth.cookies"

/**
 * Invalidate the refresh token (if any) and clear both auth cookies.
 * Idempotent — safe to call without a valid session.
 */
export const POST = apiRoute({
  span: "POST /api/auth/logout",
  status: 204,
  handle: () =>
    Effect.gen(function* () {
      const refreshToken = yield* getRefreshCookie()
      if (refreshToken) yield* Auth.logout(refreshToken)
      yield* clearAuthCookies()
    }),
})
