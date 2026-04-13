import type { Effect } from "effect"
import type { StorageError } from "@/lib/errors"

export class EntityNotFound {
  readonly _tag = "EntityNotFound"
  constructor(readonly id: string) {}
}

export interface PersistenceLayer<T extends { id: string }> {
  getAll: () => Effect.Effect<T[], StorageError>
  getById: (id: string) => Effect.Effect<T, EntityNotFound | StorageError>
  create: (item: T) => Effect.Effect<T, StorageError>
  update: (
    id: string,
    partial: {
      [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined
    },
  ) => Effect.Effect<T, EntityNotFound | StorageError>
  remove: (id: string) => Effect.Effect<void, EntityNotFound | StorageError>
}
