import { Effect, Layer, Redacted } from "effect";
import { Authentication } from "@/features/auth/http/auth.middleware";
import { NotAuthenticated } from "@/features/auth/schema/auth.schema.model";
import { Auth } from "@/features/auth/service/auth.service";

/** Server-side implementation of the {@link Authentication} middleware. */
export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const auth = yield* Auth;
    return {
      cookie: (token) =>
        auth
          .verifyToken(Redacted.value(token))
          .pipe(Effect.mapError(() => new NotAuthenticated())),
    };
  }),
);
