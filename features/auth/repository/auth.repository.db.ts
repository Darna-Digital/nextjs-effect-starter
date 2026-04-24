import { Effect } from "effect";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { refreshTokens, users } from "@/lib/db/schema";
import {
  DB_SPAN_ATTRS,
  StorageError,
  tryDb,
} from "@/lib/effect/layers/storage";
import {
  RefreshTokenExpired,
  type RefreshTokenRecord,
  type UserRecord,
} from "@/features/auth/schema/auth.schema.model";
import type {
  RefreshTokenRepo,
  UserRepo,
} from "@/features/auth/repository/auth.repository";

export const createDbUserRepository: UserRepo = {
  findByEmail: (email) =>
    tryDb("mysql.users.findByEmail", () =>
      db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email})`)
        .limit(1),
    ).pipe(Effect.map((rows) => (rows[0] as UserRecord | undefined) ?? null)),

  get: (id) =>
    tryDb("mysql.users.get", () =>
      db.select().from(users).where(eq(users.id, id)).limit(1),
    ).pipe(Effect.map((rows) => (rows[0] as UserRecord | undefined) ?? null)),

  create: (user) =>
    tryDb("mysql.users.insert", () => db.insert(users).values(user)).pipe(
      Effect.as(user),
    ),
};

export const createRefreshTokenRepository: RefreshTokenRepo = {
  create: (record) =>
    tryDb("mysql.refresh_tokens.insert", () =>
      db.insert(refreshTokens).values(record),
    ).pipe(Effect.as(record)),

  get: (id) =>
    tryDb("mysql.refresh_tokens.get", () =>
      db.select().from(refreshTokens).where(eq(refreshTokens.id, id)).limit(1),
    ).pipe(
      Effect.map((rows) => (rows[0] as RefreshTokenRecord | undefined) ?? null),
    ),

  remove: (id) =>
    tryDb("mysql.refresh_tokens.delete", () =>
      db.delete(refreshTokens).where(eq(refreshTokens.id, id)),
    ).pipe(Effect.asVoid),

  rotate: (oldId, newRecord) =>
    Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const [result] = await tx
            .delete(refreshTokens)
            .where(eq(refreshTokens.id, oldId));
          const affected =
            (result as { affectedRows?: number })?.affectedRows ?? 0;
          if (affected === 0) throw new RefreshTokenExpired();
          await tx.insert(refreshTokens).values(newRecord);
        }),
      catch: (cause) =>
        cause instanceof RefreshTokenExpired
          ? cause
          : new StorageError({ cause }),
    })
      .pipe(
        Effect.withSpan("mysql.refresh_tokens.rotate", {
          attributes: DB_SPAN_ATTRS,
        }),
      )
      .pipe(Effect.asVoid),
};
