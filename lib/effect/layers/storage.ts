import { Effect, Schema as S } from "effect";

export class StorageError extends S.TaggedErrorClass<StorageError>()(
  "StorageError",
  {},
  { httpApiStatus: 500 },
) {}

/** Logs the underlying cause and produces a wire-safe StorageError. */
export function storageError(cause: unknown): StorageError {
  console.error("StorageError", cause);
  return new StorageError();
}

export type Patch<Row> = {
  [Key in keyof Omit<Row, "id">]?: Omit<Row, "id">[Key] | undefined;
};

export const DB_SPAN_ATTRS = { "db.system": "mysql" } as const;

export function tryDb<Result>(name: string, run: () => Promise<Result>) {
  return Effect.tryPromise({
    try: run,
    catch: storageError,
  }).pipe(Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }));
}

export function stripNulls<Row>(row: object): Row {
  const out: Record<string, unknown> = {};
  for (const key in row) {
    const value = (row as Record<string, unknown>)[key];
    if (value !== null) out[key] = value;
  }
  return out as Row;
}

export function isFkReferencedError(cause: unknown): boolean {
  return matchMysqlError(
    cause,
    (e) => e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451,
  );
}

export function isUniqueViolationError(cause: unknown): boolean {
  return matchMysqlError(
    cause,
    (e) => e.code === "ER_DUP_ENTRY" || e.errno === 1062,
  );
}

function matchMysqlError(
  cause: unknown,
  pred: (e: { code?: string; errno?: number }) => boolean,
): boolean {
  let e = cause as
    | { code?: string; errno?: number; cause?: unknown }
    | undefined;
  while (e) {
    if (pred(e)) return true;
    e = e.cause as typeof e;
  }
  return false;
}
