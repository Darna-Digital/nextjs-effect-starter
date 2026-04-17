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
