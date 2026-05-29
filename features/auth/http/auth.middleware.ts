import { HttpApiMiddleware, HttpApiSecurity } from "@effect/platform";
import { CurrentUser } from "@/lib/effect/layers/auth";
import { NotAuthenticated } from "@/features/auth/schema/auth.schema.model";

/**
 * HttpApi middleware tag that authenticates a request from the `access_token`
 * cookie and provides the verified user as {@link CurrentUser}. Endpoints opt
 * in via `.middleware(Authentication)`; a missing or invalid token fails the
 * request with {@link NotAuthenticated} (401) before the handler runs.
 *
 * This module is client-safe (no service implementation) so the API group
 * definitions — and the derived client — can reference the tag without pulling
 * server-only code into the browser bundle. The implementation lives in
 * `auth.middleware.live.ts`.
 */
export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
  "Authentication",
  {
    failure: NotAuthenticated,
    provides: CurrentUser,
    security: {
      cookie: HttpApiSecurity.apiKey({ in: "cookie", key: "access_token" }),
    },
  },
) {}
