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

/**
 * The entity can't be removed because another row references it via a
 * foreign key. Storage backends that enforce referential integrity
 * (MySQL, Postgres) produce this; in-memory / JSON storage never does.
 */
export class EntityInUse<Id extends string = string> {
  readonly _tag = "EntityInUse"
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

/** Error channel for `remove` — superset of lookup, adds FK violation. */
type RemoveError<T extends { id: string }> =
  | LookupError<T>
  | EntityInUse<T["id"]>

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
  remove: (id: T["id"]) => Effect.Effect<void, RemoveError<T>>
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

/**
 * Translate a generic `EntityInUse<Id>` into a domain-specific error.
 *
 *     storage.remove(id).pipe(
 *       mapInUse((id) => new OrganizationInUse({ id })),
 *     )
 */
export const mapInUse =
  <Id extends string, DomainError>(toError: (id: Id) => DomainError) =>
  <A, E, R>(
    self: Effect.Effect<A, E | EntityInUse<Id>, R>,
  ): Effect.Effect<A, Exclude<E, EntityInUse<Id>> | DomainError, R> =>
    Effect.catchTag(
      self as Effect.Effect<A, EntityInUse<Id>, R>,
      "EntityInUse",
      (e) => Effect.fail(toError(e.id)),
    ) as Effect.Effect<A, Exclude<E, EntityInUse<Id>> | DomainError, R>
