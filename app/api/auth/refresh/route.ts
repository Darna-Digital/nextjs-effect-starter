import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { completeSession, resumeSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/refresh",
  handle: () => resumeSession().pipe(Effect.flatMap(completeSession)),
})
