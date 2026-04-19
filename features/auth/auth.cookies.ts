import { Effect } from "effect"
import { cookies } from "next/headers"

/** Cookie that carries the short-lived access JWT (sent to every API route). */
export const ACCESS_COOKIE = "access_token"

/**
 * Cookie that carries the long-lived refresh token. Scoped to `/api/auth` so
 * it is only sent to auth endpoints — other routes never see it.
 */
export const REFRESH_COOKIE = "refresh_token"

/**
 * How long the access cookie persists in the browser. The JWT inside has
 * its own (shorter) expiry — the server is the source of truth. A generous
 * cookie lifetime means expired-JWT requests hit the refresh flow instead
 * of silently logging the user out on page reload.
 */
const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

/** Matches the refresh-token TTL configured for the `Auth` service. */
const REFRESH_COOKIE_MAX_AGE = Number(
  process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60,
)

const isProd = () => process.env.NODE_ENV === "production"

export const setAuthCookies = (accessToken: string, refreshToken: string) =>
  Effect.promise(async () => {
    const jar = await cookies()
    jar.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
      path: "/",
      maxAge: ACCESS_COOKIE_MAX_AGE,
    })
    jar.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
      path: "/api/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    })
  })

export const clearAuthCookies = () =>
  Effect.promise(async () => {
    const jar = await cookies()
    jar.delete({ name: ACCESS_COOKIE, path: "/" })
    jar.delete({ name: REFRESH_COOKIE, path: "/api/auth" })
  })

/** Read the refresh cookie from the current request. `null` if missing. */
export const getRefreshCookie = () =>
  Effect.promise(async () => {
    const jar = await cookies()
    return jar.get(REFRESH_COOKIE)?.value ?? null
  })
