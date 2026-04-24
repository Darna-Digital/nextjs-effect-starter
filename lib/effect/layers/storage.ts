import { Data, Effect } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {
  toResponse(): Response {
    console.error("StorageError", this.cause);
    return Response.json({ error: "Storage error" }, { status: 500 });
  }
}

export type Patch<T> = {
  [K in keyof Omit<T, "id">]?: Omit<T, "id">[K] | undefined;
};

export const DB_SPAN_ATTRS = { "db.system": "mysql" } as const;

export const tryDb = <A>(name: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new StorageError({ cause }),
  }).pipe(Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }));

export const stripNulls = <T>(row: object): T => {
  const out: Record<string, unknown> = {};
  for (const key in row) {
    const value = (row as Record<string, unknown>)[key];
    if (value !== null) out[key] = value;
  }
  return out as T;
};

export const isFkReferencedError = (cause: unknown): boolean =>
  matchMysqlError(
    cause,
    (e) => e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451,
  );

export const isUniqueViolationError = (cause: unknown): boolean =>
  matchMysqlError(cause, (e) => e.code === "ER_DUP_ENTRY" || e.errno === 1062);

const matchMysqlError = (
  cause: unknown,
  pred: (e: { code?: string; errno?: number }) => boolean,
): boolean => {
  let e = cause as
    | { code?: string; errno?: number; cause?: unknown }
    | undefined;
  while (e) {
    if (pred(e)) return true;
    e = e.cause as typeof e;
  }
  return false;
};
