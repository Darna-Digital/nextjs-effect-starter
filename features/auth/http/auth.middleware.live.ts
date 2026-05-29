import { Effect, Layer, Redacted } from "effect";
import { auth } from "@/lib/auth/auth";
import {
  Authentication,
  NotAuthenticated,
} from "@/features/auth/http/auth.middleware";

/**
 * Server-side implementation of the {@link Authentication} middleware. Rebuilds
 * a cookie header from the session token and validates it against the same
 * Better Auth instance that serves `/api/auth/*` via `auth.api.getSession`,
 * providing the resolved user as `CurrentUser`.
 */
export const AuthenticationLive = Layer.succeed(
  Authentication,
  Authentication.of({
    cookie: (token) =>
      Effect.tryPromise({
        try: () =>
          auth.api.getSession({
            headers: new Headers({
              cookie: `better-auth.session_token=${Redacted.value(token)}`,
            }),
          }),
        catch: () => new NotAuthenticated(),
      }).pipe(
        Effect.flatMap((session) =>
          session?.user
            ? Effect.succeed(session.user)
            : Effect.fail(new NotAuthenticated()),
        ),
      ),
  }),
);
