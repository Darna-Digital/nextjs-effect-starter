import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/auth.service"
import { RefreshTokenExpired } from "@/features/auth/auth.model"
import {
  clearAuthCookies,
  getRefreshCookie,
  setAuthCookies,
} from "@/features/auth/auth.cookies"

/**
 * Rotate the session: take the refresh cookie, issue a new access +
 * refresh token pair, set them as cookies, return the public user.
 */
export const POST = apiRoute({
  span: "POST /api/auth/refresh",
  handle: () =>
    Effect.gen(function* () {
      const refreshToken = yield* getRefreshCookie()
      if (!refreshToken) {
        yield* clearAuthCookies()
        return yield* Effect.fail(new RefreshTokenExpired())
      }

      const result = yield* Auth.refresh(refreshToken).pipe(
        Effect.tapError(() => clearAuthCookies()),
      )

      yield* setAuthCookies(result.accessToken, result.refreshToken)
      return { user: result.user }
    }),
})
