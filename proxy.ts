import { NextResponse, type NextRequest } from "next/server"

/**
 * Page-level auth gate (Next.js 16 `proxy` file convention — the
 * successor to `middleware.ts`). The `refresh_token` cookie is
 * path-scoped to `/api/auth`, so it is not visible here — only
 * `access_token` is. That cookie persists long past the JWT's expiry
 * (server is the source of truth), so presence is enough to let the
 * page render and defer real auth to the client's API calls +
 * auto-refresh flow.
 *
 * API routes enforce their own auth via `requireUser` inside each handler.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("access_token")) return NextResponse.next()

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/organizations/:path*", "/projects/:path*"],
}
