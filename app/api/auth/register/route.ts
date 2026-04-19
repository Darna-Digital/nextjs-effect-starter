import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/auth.service"
import { RegisterSchema } from "@/features/auth/auth.requests"
import { completeSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/register",
  body: RegisterSchema,
  status: 201,
  handle: ({ body }) => Auth.register(body).pipe(Effect.flatMap(completeSession)),
})
