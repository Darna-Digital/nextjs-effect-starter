import { Effect, Layer, Redacted } from "effect";
import { auth } from "@/lib/auth/auth";
import { CurrentUser } from "@/lib/effect/layers/auth";
import {
  Authentication,
  NotAuthenticated,
} from "@/features/auth/http/auth.middleware";

/**
 * Resolves the Better Auth session from the cookie token, failing with
 * {@link NotAuthenticated} when absent/invalid. Traced as a child of the request
 * span so session resolution is visible end to end.
 */
const resolveUser = (credential: Redacted.Redacted<string>) =>
  Effect.tryPromise({
    try: () =>
      auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${Redacted.value(credential)}`,
        }),
      }),
    catch: () => new NotAuthenticated(),
  }).pipe(
    Effect.flatMap((session) =>
      session?.user
        ? Effect.as(
            Effect.annotateCurrentSpan({
              "auth.authenticated": true,
              "auth.user.id": session.user.id,
            }),
            session.user,
          )
        : Effect.fail(new NotAuthenticated()),
    ),
    Effect.withSpan("Auth.getSession", {
      attributes: { "auth.provider": "better-auth" },
    }),
  );

/**
 * Server-side implementation of {@link Authentication}. The v4 security
 * middleware wraps the endpoint effect: it resolves the user, then runs the
 * endpoint with {@link CurrentUser} provided.
 */
export const AuthenticationLive = Layer.succeed(Authentication, {
  cookie: (httpEffect, { credential }) =>
    resolveUser(credential).pipe(
      Effect.flatMap((user) =>
        Effect.provideService(httpEffect, CurrentUser, user),
      ),
    ),
});
