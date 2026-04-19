import { Effect } from "effect"
import { apiRoute } from "@/lib/effect/http/api-route"
import { Auth } from "@/features/auth/auth.service"
import { RegisterSchema } from "@/features/auth/auth.requests"
import { setAuthCookies } from "@/features/auth/auth.cookies"

export const POST = apiRoute({
  span: "POST /api/auth/register",
  body: RegisterSchema,
  status: 201,
  handle: ({ body }) =>
    Effect.gen(function* () {
      const { user, accessToken, refreshToken } = yield* Auth.register(body)
      yield* setAuthCookies(accessToken, refreshToken)
      return { user }
    }),
})
