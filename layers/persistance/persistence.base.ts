import { Data, Effect } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {}

export class EntityNotFound {
  readonly _tag = "EntityNotFound";
  constructor(readonly id: string) {}
}

export interface PersistenceLayer<T extends { id: string }> {
  getAll: () => Effect.Effect<T[], StorageError>;
  getById: (id: string) => Effect.Effect<T, EntityNotFound | StorageError>;
  create: (item: T) => Effect.Effect<T, StorageError>;
  update: (
    id: string,
    partial: {
      [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined;
    },
  ) => Effect.Effect<T, EntityNotFound | StorageError>;
  remove: (id: string) => Effect.Effect<void, EntityNotFound | StorageError>;
}
