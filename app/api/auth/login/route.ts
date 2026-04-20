import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/service/auth.service"
import { LoginSchema } from "@/features/auth/schema/auth.schema.requests"
import { completeSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/login",
  body: LoginSchema,
  handle: ({ body }) => Auth.login(body).pipe(Effect.flatMap(completeSession)),
})
