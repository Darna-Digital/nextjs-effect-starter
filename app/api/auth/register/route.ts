import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/service/auth.service"
import { RegisterSchema } from "@/features/auth/schema/auth.schema.requests"
import { completeSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/register",
  body: RegisterSchema,
  status: 201,
  rateLimit: { key: "auth:register", max: 5, windowMs: 60_000 },
  handle: ({ body }) => Auth.register(body).pipe(Effect.flatMap(completeSession)),
})
