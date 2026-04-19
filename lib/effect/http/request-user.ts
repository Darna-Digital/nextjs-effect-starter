import { Context, Effect } from "effect"
import type { User } from "@/lib/effect/layers/auth"

/**
 * Abstract tag: resolves who is making the current HTTP request.
 *
 * `api-route` depends on this tag — not on any concrete auth strategy.
 * Swap the implementation (JWT, API key, test stub) by providing a
 * different layer without touching the HTTP adapter.
 */
export class RequestUserResolver extends Context.Tag("RequestUserResolver")<
  RequestUserResolver,
  { resolve: (request: Request) => Effect.Effect<User> }
>() {}
