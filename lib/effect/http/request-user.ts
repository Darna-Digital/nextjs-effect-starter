import { Context, Effect } from "effect";
import type { User } from "@/lib/effect/layers/auth";

export class RequestUserResolver extends Context.Tag("RequestUserResolver")<
  RequestUserResolver,
  { resolve: (request: Request) => Effect.Effect<User> }
>() {}
