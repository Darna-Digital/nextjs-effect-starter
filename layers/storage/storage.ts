import { Data, Effect } from "effect"

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/** Something went wrong at the storage layer (file I/O, DB connection, etc.). */
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

/**
 * The entity with the given ID doesn't exist.
 *
 * Parameterized by `Id` so features with branded IDs (like `OrganizationId`)
 * get the brand back in the error — feature code never needs to cast.
 */
export class EntityNotFound<Id extends string = string> {
  readonly _tag = "EntityNotFound"
  constructor(readonly id: Id) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────────────────────────────────────

/** A patch applied to `update` — any field except `id`, any subset, optional. */
export type Patch<T> = {
  [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined
}

/** Error channel for operations that look up by ID. */
type LookupError<T extends { id: string }> =
  | EntityNotFound<T["id"]>
  | StorageError

/**
 * Generic storage contract for any entity with an `id` field.
 * Swap implementations (JSON ↔ memory ↔ Postgres) without touching
 * feature code.
 */
export interface Storage<T extends { id: string }> {
  getAll: () => Effect.Effect<T[], StorageError>
  getById: (id: T["id"]) => Effect.Effect<T, LookupError<T>>
  create: (item: T) => Effect.Effect<T, StorageError>
  update: (id: T["id"], patch: Patch<T>) => Effect.Effect<T, LookupError<T>>
  remove: (id: T["id"]) => Effect.Effect<void, LookupError<T>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Translate a generic `EntityNotFound<Id>` into a domain-specific error.
 *
 *     storage.getById(id).pipe(
 *       mapNotFound((id) => new OrganizationNotFound({ id })),
 *     )
 *
 * The `id` argument is branded: if storage returns `EntityNotFound<OrganizationId>`,
 * the callback receives an `OrganizationId` — no cast needed in feature code.
 *
 * The two `as` casts exist only because TypeScript's `Exclude` can't prove in
 * general that removing `EntityNotFound<Id>` from `E | EntityNotFound<Id>`
 * yields `Exclude<E, EntityNotFound<Id>>`. Runtime behavior is plain
 * `Effect.catchTag`.
 */
export const mapNotFound =
  <Id extends string, DomainError>(toError: (id: Id) => DomainError) =>
  <A, E, R>(
    self: Effect.Effect<A, E | EntityNotFound<Id>, R>,
  ): Effect.Effect<A, Exclude<E, EntityNotFound<Id>> | DomainError, R> =>
    Effect.catchTag(
      self as Effect.Effect<A, EntityNotFound<Id>, R>,
      "EntityNotFound",
      (e) => Effect.fail(toError(e.id)),
    ) as Effect.Effect<A, Exclude<E, EntityNotFound<Id>> | DomainError, R>
