import { Effect } from "effect";
import * as fs from "node:fs/promises";
import { EntityNotFound, StorageError, type Storage } from "./storage";

/**
 * JSON-file-backed `Storage<T>`. Reads and writes the whole file on every
 * operation — fine for tiny datasets and demos, not for production.
 * For anything real, replace with a DB-backed Storage.
 */
export const createJsonStorageLayer = <T extends { id: string }>(
  filePath: string,
): Storage<T> => {
  const readAll = readJson<T>(filePath);
  const writeAll = (data: T[]) => writeJson(filePath, data);

  return {
    getAll: () => readAll,

    getById: (id) =>
      Effect.gen(function* () {
        const items = yield* readAll;
        const item = items.find((i) => i.id === id);
        if (!item) return yield* Effect.fail(new EntityNotFound(id));
        return item;
      }),

    create: (item) =>
      Effect.gen(function* () {
        const items = yield* readAll;
        yield* writeAll([...items, item]);
        return item;
      }),

    update: (id, patch) =>
      Effect.gen(function* () {
        const items = yield* readAll;
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return yield* Effect.fail(new EntityNotFound(id));
        const updated = { ...items[index], ...patch } as T;
        const next = [...items];
        next[index] = updated;
        yield* writeAll(next);
        return updated;
      }),

    remove: (id) =>
      Effect.gen(function* () {
        const items = yield* readAll;
        const filtered = items.filter((i) => i.id !== id);
        if (filtered.length === items.length)
          return yield* Effect.fail(new EntityNotFound(id));
        yield* writeAll(filtered);
      }),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

const readJson = <T>(filePath: string): Effect.Effect<T[], StorageError> =>
  Effect.tryPromise({
    try: async () => {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        return JSON.parse(raw) as T[];
      } catch {
        return [] as T[];
      }
    },
    catch: (cause) => new StorageError({ cause }),
  });

const writeJson = <T>(
  filePath: string,
  data: T[],
): Effect.Effect<void, StorageError> =>
  Effect.tryPromise({
    try: async () => {
      const dir = filePath.substring(0, filePath.lastIndexOf("/"));
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    },
    catch: (cause) => new StorageError({ cause }),
  });
