import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";
import { Schema as S } from "effect";
import { CurrentUser } from "@/lib/effect/layers/auth";

/** Raised (401) when a request has no valid Better Auth session. */
export class NotAuthenticated extends S.TaggedErrorClass<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  { httpApiStatus: 401 },
) {}

/**
 * HttpApi middleware that authenticates a request from the Better Auth session
 * cookie and provides the resolved user as {@link CurrentUser}. Endpoints opt in
 * via `.middleware(Authentication)`; a missing/invalid session fails with
 * {@link NotAuthenticated} (401). Implementation lives in `auth.middleware.live.ts`.
 *
 * This module is client-safe (definition only, no server imports).
 */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser }
>()("Authentication", {
  error: NotAuthenticated,
  security: {
    // Dev cookie name. (In production Better Auth prefixes `__Secure-`.)
    cookie: HttpApiSecurity.apiKey({
      in: "cookie",
      key: "better-auth.session_token",
    }),
  },
}) {}
