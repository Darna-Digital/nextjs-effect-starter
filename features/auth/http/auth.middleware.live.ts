import { Effect, Layer, Redacted } from "effect";
import { auth } from "@/lib/auth/auth";
import { CurrentUser } from "@/lib/effect/layers/auth";
import {
  Authentication,
  NotAuthenticated,
} from "@/features/auth/http/auth.middleware";

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

export const AuthenticationLive = Layer.succeed(Authentication, {
  cookie: (httpEffect, { credential }) =>
    resolveUser(credential).pipe(
      Effect.flatMap((user) =>
        Effect.provideService(httpEffect, CurrentUser, user),
      ),
    ),
});
