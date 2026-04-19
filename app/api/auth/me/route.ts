import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { requireUser } from "@/features/auth/auth.http"

export const GET = apiRoute({
  span: "GET /api/auth/me",
  handle: () =>
    Effect.gen(function* () {
      const user = yield* requireUser
      return { user }
    }),
})
