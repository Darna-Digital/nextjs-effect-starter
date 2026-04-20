import { Data, Effect } from "effect"

/**
 * In-process sliding-window rate limiter. Keyed by route + client ip;
 * per Node instance, so a multi-instance deployment would need Redis or
 * similar. Good enough for a single-node starter — swap the `buckets`
 * Map for a Redis-backed store when you scale out.
 */

export class TooManyRequests extends Data.TaggedError("TooManyRequests")<{
  readonly retryAfter: number
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Too many requests", retryAfter: this.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(this.retryAfter) },
      },
    )
  }
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export interface RateLimitConfig {
  /** Logical name used in the bucket key — usually the route. */
  key: string
  /** Max requests allowed within the window. */
  max: number
  /** Window size in milliseconds. */
  windowMs: number
}

/** `X-Forwarded-For` first hop, then `X-Real-IP`, else "unknown". */
export const clientIp = (request: Request): string => {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

/**
 * Fails with `TooManyRequests` when the caller has exceeded `max` hits
 * within `windowMs`. Cheap: single Map lookup + optional insert.
 */
export const enforceRateLimit = (
  request: Request,
  { key, max, windowMs }: RateLimitConfig,
) =>
  Effect.sync(() => {
    const bucketKey = `${key}:${clientIp(request)}`
    const now = Date.now()
    const entry = buckets.get(bucketKey)

    if (!entry || entry.resetAt < now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
      return null
    }
    if (entry.count >= max) {
      return Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    }
    entry.count++
    return null
  }).pipe(
    Effect.flatMap((retryAfter) =>
      retryAfter === null
        ? Effect.void
        : Effect.fail(new TooManyRequests({ retryAfter })),
    ),
  )
