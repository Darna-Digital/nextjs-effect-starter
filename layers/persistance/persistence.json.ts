import { Effect } from "effect"
import * as fs from "node:fs/promises"
import { PersistenceLayer, StorageError } from "./persistence.base"
import { EntityNotFound } from "./persistence.base"

const readJson = <T>(filePath: string): Effect.Effect<T[], StorageError> =>
  Effect.tryPromise({
    try: async () => {
      try {
        const raw = await fs.readFile(filePath, "utf-8")
        return JSON.parse(raw) as T[]
      } catch {
        return [] as T[]
      }
    },
    catch: (cause) => new StorageError({ cause }),
  })

const writeJson = <T>(
  filePath: string,
  data: T[],
): Effect.Effect<void, StorageError> =>
  Effect.tryPromise({
    try: async () => {
      const dir = filePath.substring(0, filePath.lastIndexOf("/"))
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    },
    catch: (cause) => new StorageError({ cause }),
  })

export const createJsonPersistence = <T extends { id: string }>(
  filePath: string,
): PersistenceLayer<T> => ({
  getAll: () => readJson<T>(filePath),

  getById: (id) =>
    Effect.gen(function* () {
      const items = yield* readJson<T>(filePath)
      const item = items.find((i) => i.id === id)
      if (!item) return yield* Effect.fail(new EntityNotFound(id))
      return item
    }),

  create: (item) =>
    Effect.gen(function* () {
      const items = yield* readJson<T>(filePath)
      yield* writeJson(filePath, [...items, item])
      return item
    }),

  update: (id, partial) =>
    Effect.gen(function* () {
      const items = yield* readJson<T>(filePath)
      const index = items.findIndex((i) => i.id === id)
      if (index === -1) return yield* Effect.fail(new EntityNotFound(id))
      const updated = { ...items[index], ...partial } as T
      const next = [...items]
      next[index] = updated
      yield* writeJson(filePath, next)
      return updated
    }),

  remove: (id) =>
    Effect.gen(function* () {
      const items = yield* readJson<T>(filePath)
      const filtered = items.filter((i) => i.id !== id)
      if (filtered.length === items.length)
        return yield* Effect.fail(new EntityNotFound(id))
      yield* writeJson(filePath, filtered)
    }),
})
