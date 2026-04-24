import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { completeSession, resumeSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/refresh",
  rateLimit: { key: "auth:refresh", max: 30, windowMs: 60_000 },
  handle: () => resumeSession().pipe(Effect.flatMap(completeSession)),
})
