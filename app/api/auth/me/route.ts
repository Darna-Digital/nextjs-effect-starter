import { Effect } from "effect"
import { apiRoute, requireUser } from "@/lib/effect/http/api-route"

export const GET = apiRoute({
  span: "GET /api/auth/me",
  handle: () =>
    Effect.gen(function* () {
      const user = yield* requireUser
      return { user }
    }),
})
