import {
  HttpApiMiddleware,
  HttpApiSchema,
  HttpApiSecurity,
} from "@effect/platform";
import { Schema as S } from "effect";
import { CurrentUser } from "@/lib/effect/layers/auth";

/** Raised (401) when a request has no valid Better Auth session. */
export class NotAuthenticated extends S.TaggedError<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  HttpApiSchema.annotations({ status: 401 }),
) {}

/**
 * HttpApi middleware tag that authenticates a request from the Better Auth
 * session cookie and provides the resolved user as {@link CurrentUser}.
 * Endpoints opt in via `.middleware(Authentication)`; a missing or invalid
 * session fails the request with {@link NotAuthenticated} (401).
 *
 * This module is client-safe (no service implementation, no server-only
 * imports) so the API group definitions — and the derived client — can
 * reference the tag without pulling Better Auth into the browser bundle. The
 * implementation lives in `auth.middleware.live.ts`.
 */
export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Authentication",
  {
    failure: NotAuthenticated,
    provides: CurrentUser,
    security: {
      // Dev cookie name. (In production Better Auth prefixes `__Secure-`.)
      cookie: HttpApiSecurity.apiKey({
        in: "cookie",
        key: "better-auth.session_token",
      }),
    },
  },
) {}
