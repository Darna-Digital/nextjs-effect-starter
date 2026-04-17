import { Data, Effect } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {
  toResponse(): Response {
    return Response.json(
      { error: "Storage error", cause: String(this.cause) },
      { status: 500 },
    );
  }
}

/**
 * Generic "entity not found" error, parameterized by the entity's ID type.
 * When `T["id"]` is a branded type (e.g. `OrganizationId`), the error's
 * `id` is branded too — no casting at feature boundaries.
 */
export class EntityNotFound<Id extends string = string> {
  readonly _tag = "EntityNotFound";
  constructor(readonly id: Id) {}
}

/**
 * Translate a persistence-level `EntityNotFound` into a domain-specific error.
 * The `id` parameter carries the branded entity ID (no casting needed).
 *
 * @example
 *   persistence.getById(id).pipe(
 *     mapEntityNotFound((id) => new OrganizationNotFound({ id })),
 *   )
 */
export const mapEntityNotFound =
  <Id extends string, E1>(toError: (id: Id) => E1) =>
  <A, E, R>(
    self: Effect.Effect<A, E | EntityNotFound<Id>, R>,
  ): Effect.Effect<A, Exclude<E, EntityNotFound<Id>> | E1, R> =>
    Effect.catchTag(
      self as Effect.Effect<A, EntityNotFound<Id>, R>,
      "EntityNotFound",
      (e) => Effect.fail(toError(e.id)),
    ) as Effect.Effect<A, Exclude<E, EntityNotFound<Id>> | E1, R>;

export interface PersistenceLayer<T extends { id: string }> {
  getAll: () => Effect.Effect<T[], StorageError>;
  getById: (
    id: T["id"],
  ) => Effect.Effect<T, EntityNotFound<T["id"]> | StorageError>;
  create: (item: T) => Effect.Effect<T, StorageError>;
  update: (
    id: T["id"],
    partial: {
      [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined;
    },
  ) => Effect.Effect<T, EntityNotFound<T["id"]> | StorageError>;
  remove: (
    id: T["id"],
  ) => Effect.Effect<void, EntityNotFound<T["id"]> | StorageError>;
}
