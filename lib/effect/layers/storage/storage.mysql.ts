/* eslint-disable @typescript-eslint/no-explicit-any */
import { Effect } from "effect";
import { eq } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { Db } from "@/lib/db/client";
import {
  EntityInUse,
  EntityNotFound,
  StorageError,
  type Storage,
} from "./storage.base";

/**
 * MySQL: row referenced by another row via FK (ER_ROW_IS_REFERENCED_2, errno 1451).
 * Drizzle wraps the mysql2 driver error in its own Error, so we walk the
 * `.cause` chain looking for the driver-level code.
 */
const isFkReferencedError = (cause: unknown): boolean => {
  let e = cause as
    | { code?: string; errno?: number; cause?: unknown }
    | undefined;
  while (e) {
    if (e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451) return true;
    e = e.cause as typeof e;
  }
  return false;
};

/**
 * Drizzle-backed `Storage<T>` for a MySQL table.
 *
 *     const storage = mysqlStorage<Organization>(db, organizations)
 *
 * The table's inferred row type must match `T`. Drizzle does not expose
 * a public way to make that generic constraint checkable, so the cast
 * is trusted at the call site. Keep the two aligned via the brand on
 * the table's `id` column (`$type<OrganizationId>()`) and the entity
 * type in the model file.
 */
export const createMysqlStorageLayer = <T extends { id: string }>(
  db: Db,
  table: MySqlTable & { id: any },
): Storage<T> => {
  const tryDb = <A>(run: () => Promise<A>) =>
    Effect.tryPromise({
      try: run,
      catch: (cause) => new StorageError({ cause }),
    });

  /**
   * MySQL returns `null` for absent nullable columns, but the domain
   * uses `S.optional(...)` (expects `undefined`). Strip nulls on read
   * so the same row shape works across storages.
   */
  const stripNulls = (row: Record<string, unknown>): T => {
    const out: Record<string, unknown> = {};
    for (const key in row) if (row[key] !== null) out[key] = row[key];
    return out as T;
  };

  const selectById = (id: T["id"]) =>
    tryDb(() => db.select().from(table).where(eq(table.id, id)).limit(1)).pipe(
      Effect.map((rows) => (rows as Record<string, unknown>[]).map(stripNulls)),
    );

  return {
    getAll: () =>
      tryDb(() => db.select().from(table)).pipe(
        Effect.map((rows) =>
          (rows as Record<string, unknown>[]).map(stripNulls),
        ),
      ),

    getById: (id) =>
      Effect.gen(function* () {
        const rows = yield* selectById(id);
        if (rows.length === 0)
          return yield* Effect.fail(new EntityNotFound(id));
        return rows[0];
      }),

    create: (item) =>
      tryDb(() => db.insert(table).values(item as any)).pipe(Effect.as(item)),

    update: (id, patch) =>
      Effect.gen(function* () {
        const existing = yield* selectById(id);
        if (existing.length === 0)
          return yield* Effect.fail(new EntityNotFound(id));
        yield* tryDb(() =>
          db
            .update(table)
            .set(patch as any)
            .where(eq(table.id, id)),
        );
        const updated = yield* selectById(id);
        return updated[0];
      }),

    remove: (id) =>
      Effect.gen(function* () {
        const existing = yield* selectById(id);
        if (existing.length === 0)
          return yield* Effect.fail(new EntityNotFound(id));
        // Distinguish FK violation from generic storage failure so feature
        // code can translate it into a domain error (e.g. 409 instead of 500).
        yield* Effect.tryPromise({
          try: () => db.delete(table).where(eq(table.id, id)),
          catch: (cause) =>
            isFkReferencedError(cause)
              ? new EntityInUse(id)
              : new StorageError({ cause }),
        });
      }),
  };
};
