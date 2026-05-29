import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";
import { Schema as S } from "effect";
import { CurrentUser } from "@/lib/effect/layers/auth";

export class NotAuthenticated extends S.TaggedErrorClass<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  { httpApiStatus: 401 },
) {}

export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser }
>()("Authentication", {
  error: NotAuthenticated,
  security: {
    cookie: HttpApiSecurity.apiKey({
      in: "cookie",
      key: "better-auth.session_token",
    }),
  },
}) {}
