import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { organizations } from "@/lib/db/schema"
import { StorageError, isFkReferencedError } from "@/lib/effect/layers/storage"
import {
  OrganizationInUse,
  OrganizationNotFound,
  type Organization,
} from "@/features/organization/schema/organization.schema.model"
import type { OrganizationRepo } from "@/features/organization/repository/organization.repository"

const tryDb = <A>(run: () => Promise<A>) =>
  Effect.tryPromise({ try: run, catch: (cause) => new StorageError({ cause }) })

/**
 * Drizzle returns `null` for absent nullable columns; the domain uses
 * `S.optional(...)` (expects `undefined`). Strip nulls on read.
 */
const stripNulls = (row: Record<string, unknown>): Organization => {
  const out: Record<string, unknown> = {}
  for (const key in row) if (row[key] !== null) out[key] = row[key]
  return out as Organization
}

const findOne = (id: Organization["id"]) =>
  tryDb(() =>
    db.select().from(organizations).where(eq(organizations.id, id)).limit(1),
  ).pipe(Effect.map((rows) => (rows[0] as Record<string, unknown>) ?? null))

export const mysqlOrganizationRepository: OrganizationRepo = {
  list: () =>
    tryDb(() => db.select().from(organizations)).pipe(
      Effect.map((rows) =>
        (rows as Record<string, unknown>[]).map(stripNulls),
      ),
    ),

  get: (id) =>
    Effect.gen(function* () {
      const row = yield* findOne(id)
      if (!row) return yield* Effect.fail(new OrganizationNotFound({ id }))
      return stripNulls(row)
    }),

  create: (org) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tryDb(() => db.insert(organizations).values(org as any)).pipe(
      Effect.as(org),
    ),

  update: (id, patch) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing)
        return yield* Effect.fail(new OrganizationNotFound({ id }))
      yield* tryDb(() =>
        db
          .update(organizations)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set(patch as any)
          .where(eq(organizations.id, id)),
      )
      const updated = yield* findOne(id)
      return stripNulls(updated as Record<string, unknown>)
    }),

  remove: (id) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing)
        return yield* Effect.fail(new OrganizationNotFound({ id }))
      yield* Effect.tryPromise({
        try: () =>
          db.delete(organizations).where(eq(organizations.id, id)),
        // Translate FK-violation into the domain-level "in use" error so
        // callers can render it as a 409 instead of a generic 500.
        catch: (cause) =>
          isFkReferencedError(cause)
            ? new OrganizationInUse({ id })
            : new StorageError({ cause }),
      })
    }),
}
