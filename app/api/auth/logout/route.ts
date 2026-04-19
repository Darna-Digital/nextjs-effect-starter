import { apiRoute } from "@/lib/effect/http/api-route"
import { endSession } from "@/features/auth/auth.http"

export const POST = apiRoute({
  span: "POST /api/auth/logout",
  status: 204,
  handle: () => endSession(),
})
