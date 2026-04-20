import { Data } from "effect"

/**
 * Shared primitives used by every feature's repository.
 *
 * The generic `Storage<T>` abstraction is deliberately gone — each feature
 * expresses its own query shape (filterable list, `findByEmail`, etc.) and
 * emits its own domain errors. What stays at this level is the stuff that
 * really is common:
 *
 *  - `StorageError`       — wraps I/O failures from any backend.
 *  - `Patch<T>`           — the "partial update" shape.
 *  - `isFkReferencedError` — detects MySQL FK-constraint violations so
 *                            repos can translate them into domain errors
 *                            like `OrganizationInUse`.
 */

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Storage error", cause: String(this.cause) },
      { status: 500 },
    )
  }
}

/** A partial update: any field except `id`, any subset, each optional. */
export type Patch<T> = {
  [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined
}

/**
 * MySQL: row referenced by another row via FK
 * (`ER_ROW_IS_REFERENCED_2`, errno 1451). Drizzle wraps the mysql2
 * driver error in its own `Error`, so walk the `.cause` chain.
 */
export const isFkReferencedError = (cause: unknown): boolean => {
  let e = cause as
    | { code?: string; errno?: number; cause?: unknown }
    | undefined
  while (e) {
    if (e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451) return true
    e = e.cause as typeof e
  }
  return false
}
