import { Data, Effect } from "effect"

/**
 * Shared primitives used by every feature's repository.
 *
 * The generic `Storage<T>` abstraction is deliberately gone — each feature
 * expresses its own query shape (filterable list, `findByEmail`, etc.) and
 * emits its own domain errors. What stays at this level is the stuff that
 * really is common across MySQL-backed feature repos:
 *
 *  - `StorageError`           — wraps I/O failures from any backend.
 *  - `Patch<T>`               — the "partial update" shape.
 *  - `tryDb(run)`             — `Effect.tryPromise` + `StorageError` mapping.
 *  - `stripNulls(row)`        — Drizzle null → undefined (domain uses `S.optional`).
 *  - `isFkReferencedError`    — MySQL FK-constraint violation detector.
 *  - `isUniqueViolationError` — MySQL `ER_DUP_ENTRY` detector.
 */

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown
}> {
  toResponse(): Response {
    // Log server-side — the `cause` typically carries DB error messages
    // that reveal schema details. Keep the wire body flat.
    console.error("StorageError", this.cause)
    return Response.json({ error: "Storage error" }, { status: 500 })
  }
}

/** A partial update: any field except `id`, any subset, each optional. */
export type Patch<T> = {
  [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined
}

/**
 * Semantic-conventions-ish attributes applied to every DB span, so the
 * trace UI groups queries the same way regardless of which repo emitted
 * them. Add `db.operation` / `db.sql.table` per call when useful.
 */
export const DB_SPAN_ATTRS = { "db.system": "mysql" } as const

/**
 * Runs a DB promise, mapping any rejection into `StorageError` and
 * wrapping it in an OTel span. Name convention: `mysql.<table>.<operation>`
 * (e.g. `mysql.projects.list`, `mysql.refresh_tokens.rotate`).
 */
export const tryDb = <A>(name: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new StorageError({ cause }),
  }).pipe(Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }))

/**
 * Drizzle returns `null` for absent nullable columns; our schemas use
 * `S.optional(...)` (expects `undefined`). Strip nulls on read so the
 * domain shape matches across backends.
 *
 * The target type is supplied explicitly — this is also where ID columns
 * get re-branded from plain `string` (storage) to the feature's branded
 * ID (domain). Repositories are the only place that cross this boundary.
 */
export const stripNulls = <T>(row: object): T => {
  const out: Record<string, unknown> = {}
  for (const key in row) {
    const value = (row as Record<string, unknown>)[key]
    if (value !== null) out[key] = value
  }
  return out as T
}

/**
 * MySQL: row referenced by another row via FK
 * (`ER_ROW_IS_REFERENCED_2`, errno 1451). Drizzle wraps the mysql2
 * driver error in its own `Error`, so walk the `.cause` chain.
 */
export const isFkReferencedError = (cause: unknown): boolean =>
  matchMysqlError(cause, (e) =>
    e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451,
  )

/** MySQL: duplicate key on a UNIQUE index (`ER_DUP_ENTRY`, errno 1062). */
export const isUniqueViolationError = (cause: unknown): boolean =>
  matchMysqlError(
    cause,
    (e) => e.code === "ER_DUP_ENTRY" || e.errno === 1062,
  )

const matchMysqlError = (
  cause: unknown,
  pred: (e: { code?: string; errno?: number }) => boolean,
): boolean => {
  let e = cause as
    | { code?: string; errno?: number; cause?: unknown }
    | undefined
  while (e) {
    if (pred(e)) return true
    e = e.cause as typeof e
  }
  return false
}
