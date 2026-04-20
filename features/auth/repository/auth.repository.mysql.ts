import { Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { refreshTokens, users } from "@/lib/db/schema"
import { StorageError, tryDb } from "@/lib/effect/layers/storage"
import {
  RefreshTokenExpired,
  type RefreshTokenRecord,
  type UserRecord,
} from "@/features/auth/schema/auth.schema.model"
import type {
  RefreshTokenRepo,
  UserRepo,
} from "@/features/auth/repository/auth.repository"

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

export const mysqlUserRepository: UserRepo = {
  findByEmail: (email) =>
    tryDb(() =>
      db
        .select()
        .from(users)
        // Emails are normalized (trim + lowercase) by the Email schema at
        // the request edge, but use LOWER() for defense-in-depth across
        // collations.
        .where(sql`LOWER(${users.email}) = LOWER(${email})`)
        .limit(1),
    ).pipe(
      Effect.map((rows) => (rows[0] as UserRecord | undefined) ?? null),
    ),

  get: (id) =>
    tryDb(() =>
      db.select().from(users).where(eq(users.id, id)).limit(1),
    ).pipe(
      Effect.map((rows) => (rows[0] as UserRecord | undefined) ?? null),
    ),

  create: (user) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tryDb(() => db.insert(users).values(user as any)).pipe(Effect.as(user)),
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh tokens
// ─────────────────────────────────────────────────────────────────────────────

export const mysqlRefreshTokenRepository: RefreshTokenRepo = {
  create: (record) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tryDb(() => db.insert(refreshTokens).values(record as any)).pipe(
      Effect.as(record),
    ),

  get: (id) =>
    tryDb(() =>
      db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.id, id))
        .limit(1),
    ).pipe(
      Effect.map(
        (rows) => (rows[0] as RefreshTokenRecord | undefined) ?? null,
      ),
    ),

  remove: (id) =>
    tryDb(() =>
      db.delete(refreshTokens).where(eq(refreshTokens.id, id)),
    ).pipe(Effect.asVoid),

  rotate: (oldId, newRecord) =>
    Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          const [result] = await tx
            .delete(refreshTokens)
            .where(eq(refreshTokens.id, oldId))
          // Both drizzle-mysql2 shapes in the wild: `{ affectedRows }` or
          // `ResultSetHeader`. Coerce defensively.
          const affected =
            (result as { affectedRows?: number })?.affectedRows ?? 0
          if (affected === 0) throw new RefreshTokenExpired()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await tx.insert(refreshTokens).values(newRecord as any)
        }),
      catch: (cause) =>
        cause instanceof RefreshTokenExpired
          ? cause
          : new StorageError({ cause }),
    }).pipe(Effect.asVoid),
}
