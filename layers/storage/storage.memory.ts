import { Effect, Ref } from "effect";
import { EntityNotFound, type Storage } from "./storage";

/**
 * In-memory `Storage<T>` backed by a `Ref`. Used by tests and dev seeding.
 * Each call returns a fresh, isolated store — no shared state between tests.
 */
export const createMemoryStorageLayer = <T extends { id: string }>(
  initial: T[] = [],
): Effect.Effect<Storage<T>> =>
  Effect.gen(function* () {
    const store = yield* Ref.make<T[]>(initial);

    return {
      getAll: () => Ref.get(store),

      getById: (id) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store);
          const item = items.find((i) => i.id === id);
          if (!item) return yield* Effect.fail(new EntityNotFound(id));
          return item;
        }),

      create: (item) =>
        Ref.update(store, (items) => [...items, item]).pipe(Effect.as(item)),

      update: (id, patch) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store);
          const index = items.findIndex((i) => i.id === id);
          if (index === -1) return yield* Effect.fail(new EntityNotFound(id));
          const updated = { ...items[index], ...patch } as T;
          yield* Ref.update(store, (current) => {
            const next = [...current];
            next[index] = updated;
            return next;
          });
          return updated;
        }),

      remove: (id) =>
        Effect.gen(function* () {
          const items = yield* Ref.get(store);
          const filtered = items.filter((i) => i.id !== id);
          if (filtered.length === items.length)
            return yield* Effect.fail(new EntityNotFound(id));
          yield* Ref.set(store, filtered);
        }),
    };
  });
