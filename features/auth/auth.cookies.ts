import { Effect } from "effect"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/effect/http/api-route"

/** 7-day rolling session matching the default `AUTH_JWT_EXPIRES_IN`. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

const sessionOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
})

export const setSessionCookie = (token: string) =>
  Effect.promise(async () => {
    const jar = await cookies()
    jar.set(SESSION_COOKIE, token, sessionOptions())
  })

export const clearSessionCookie = () =>
  Effect.promise(async () => {
    const jar = await cookies()
    jar.delete(SESSION_COOKIE)
  })
