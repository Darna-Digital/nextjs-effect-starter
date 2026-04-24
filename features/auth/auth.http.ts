import { Effect, Layer } from "effect"
import { cookies } from "next/headers"
import { RequestUserResolver } from "@/lib/effect/http/request-user"
import { CurrentUser, type User } from "@/lib/effect/layers/auth"
import {
  NotAuthenticated,
  RefreshTokenExpired,
  type PublicUser,
} from "@/features/auth/schema/auth.schema.model"
import { Auth } from "@/features/auth/service/auth.service"

/**
 * The auth feature's HTTP boundary — everything between `Auth` (pure business
 * logic) and Next.js (cookies, request headers). Four things live here:
 *
 *   1. Cookie constants + read/write helpers.
 *   2. `RequestUserResolverLive` — cookie-based impl of the resolver tag.
 *   3. `requireUser` — the route-handler guard.
 *   4. Session lifecycle verbs — `completeSession` / `resumeSession` /
 *      `endSession`. Routes compose these into one-liners.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Cookies
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_COOKIE = "access_token"
const REFRESH_COOKIE = "refresh_token"

/**
 * Persist the access cookie well past its JWT expiry. The server is the
 * source of truth — expired-JWT requests hit the refresh flow, not a
 * silent logout.
 */
const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

/**
 * Matches the refresh-token TTL configured for the `Auth` service. The
 * default (1 week) lives in two spots: here, and in `auth.layer.live.ts`
 * when it reads the same env var. Keep them in sync — or set the env
 * var explicitly and the duplication becomes moot.
 */
const REFRESH_COOKIE_MAX_AGE = Number(
  process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60,
)

const isProd = process.env.NODE_ENV === "production"

function setAuthCookies(accessToken: string, refreshToken: string) {
  return Effect.promise(async () => {
    const jar = await cookies()
    jar.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: ACCESS_COOKIE_MAX_AGE,
    })
    jar.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/api/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    })
  })
}

function clearAuthCookies() {
  return Effect.promise(async () => {
    const jar = await cookies()
    jar.delete({ name: ACCESS_COOKIE, path: "/" })
    jar.delete({ name: REFRESH_COOKIE, path: "/api/auth" })
  })
}

function getRefreshCookie() {
  return Effect.promise(async () => {
    const jar = await cookies()
    return jar.get(REFRESH_COOKIE)?.value ?? null
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Request-user resolver (cookie strategy)
// ─────────────────────────────────────────────────────────────────────────────

/** Sentinel bound when the request carries no valid access token. */
const ANONYMOUS_USER: User = {
  id: "anonymous",
  email: "anonymous@demo.local",
}

/**
 * Cookie-based implementation of `RequestUserResolver`. Reads the
 * `access_token` cookie from the raw `Request` (so it also works in tests
 * that fabricate a `Request`), verifies with `Auth.verifyToken`, and falls
 * back to `ANONYMOUS_USER` on any failure so public routes still run.
 */
export const RequestUserResolverLive = Layer.effect(
  RequestUserResolver,
  Effect.gen(function* () {
    const auth = yield* Auth
    return {
      resolve: (request: Request): Effect.Effect<User> =>
        Effect.gen(function* () {
          const token = parseCookie(
            request.headers.get("cookie"),
            ACCESS_COOKIE,
          )
          if (!token) return ANONYMOUS_USER
          return yield* auth
            .verifyToken(token)
            .pipe(Effect.catchAll(() => Effect.succeed(ANONYMOUS_USER)))
        }),
    }
  }),
)

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=")
    if (k === name) return decodeURIComponent(v.join("="))
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fails with `NotAuthenticated` (→ 401) when the request has no valid
 * session. Use inside `handle:` on any protected route.
 */
export const applyAuthMiddleware = Effect.gen(function* () {
  const user = yield* CurrentUser
  if (user.id === ANONYMOUS_USER.id)
    return yield* Effect.fail(new NotAuthenticated())
  return user
})

// ─────────────────────────────────────────────────────────────────────────────
// Session lifecycle — the three verbs every auth route needs
// ─────────────────────────────────────────────────────────────────────────────

type Session = {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

/** Begin a session: write both tokens as cookies, return only the user. */
export function completeSession(session: Session) {
  return setAuthCookies(session.accessToken, session.refreshToken).pipe(
    Effect.as({ user: session.user }),
  )
}

/**
 * Rotate the session from the refresh cookie. Missing cookie → fail; any
 * failure from `Auth.refresh` also clears cookies so the client's
 * auto-refresh loop can't spin forever.
 */
export function resumeSession() {
  return Effect.gen(function* () {
    const token = yield* getRefreshCookie()
    if (!token) {
      yield* clearAuthCookies()
      return yield* Effect.fail(new RefreshTokenExpired())
    }
    return yield* Auth.refresh(token).pipe(
      Effect.tapError(() => clearAuthCookies()),
    )
  })
}

/** Invalidate server-side + clear cookies. Idempotent. */
export function endSession() {
  return Effect.gen(function* () {
    const token = yield* getRefreshCookie()
    if (token) yield* Auth.logout(token)
    yield* clearAuthCookies()
  })
}
