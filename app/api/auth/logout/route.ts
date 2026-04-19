import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { clearSessionCookie } from "@/features/auth/auth.cookies"

export const POST = apiRoute({
  span: "POST /api/auth/logout",
  status: 204,
  handle: () => Effect.asVoid(clearSessionCookie()),
})
