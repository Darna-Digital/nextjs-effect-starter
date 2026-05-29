import { Effect, Layer, Redacted } from "effect";
import { auth } from "@/lib/auth/auth";
import {
  Authentication,
  NotAuthenticated,
} from "@/features/auth/http/auth.middleware";

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
      ),
  }),
);
