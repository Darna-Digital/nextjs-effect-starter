import { Effect, Layer } from "effect"
import { RequestUserResolver } from "@/lib/effect/http/request-user"
import { CurrentUser, type User } from "@/lib/effect/layers/auth"
import { ACCESS_COOKIE } from "./auth.cookies"
import { NotAuthenticated } from "./auth.model"
import { Auth } from "./auth.service"

/** Sentinel bound when the request carries no valid access token. */
export const ANONYMOUS_USER: User = {
  id: "anonymous",
  email: "anonymous@demo.local",
}

/**
 * Cookie-based implementation of `RequestUserResolver`.
 *
 * Reads the `access_token` cookie, verifies it with `Auth.verifyToken`, and
 * falls back to `ANONYMOUS_USER` on any failure so public routes still run.
 *
 * Requires `Auth` in the layer graph — see `AuthStackLive` in `auth.layers.live.ts`.
 */
export const RequestUserResolverLive = Layer.effect(
  RequestUserResolver,
  Effect.gen(function* () {
    // Capture the resolved Auth service once at layer construction time so
    // each `.resolve()` call returns Effect<User, never, never>.
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

/**
 * Minimal RFC-6265 cookie header parser. Only picks a single named cookie —
 * good enough for auth tokens. Returns `undefined` when the header is missing
 * or the cookie is not present.
 */
const parseCookie = (
  header: string | null,
  name: string,
): string | undefined => {
  if (!header) return undefined
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=")
    if (k === name) return decodeURIComponent(v.join("="))
  }
  return undefined
}

/**
 * Fails with `NotAuthenticated` (→ 401) when the request has no valid token.
 * Use inside `handle:` on any route that requires a real user.
 *
 * @example
 * handle: () => Effect.gen(function* () {
 *   const user = yield* requireUser
 *   // user is guaranteed non-anonymous here
 * })
 */
export const requireUser = Effect.gen(function* () {
  const user = yield* CurrentUser
  if (user.id === ANONYMOUS_USER.id)
    return yield* Effect.fail(new NotAuthenticated())
  return user
})
