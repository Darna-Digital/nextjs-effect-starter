import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { organizations } from "@/lib/db/schema"
import {
  StorageError,
  isFkReferencedError,
  isUniqueViolationError,
  stripNulls,
  tryDb,
} from "@/lib/effect/layers/storage"
import {
  OrganizationInUse,
  OrganizationNameTaken,
  OrganizationNotFound,
  type Organization,
} from "@/features/organization/schema/organization.schema.model"
import type { OrganizationRepo } from "@/features/organization/repository/organization.repository"

const findOne = (id: Organization["id"]) =>
  tryDb(() =>
    db.select().from(organizations).where(eq(organizations.id, id)).limit(1),
  ).pipe(Effect.map((rows) => (rows[0] as Record<string, unknown>) ?? null))

export const mysqlOrganizationRepository: OrganizationRepo = {
  list: () =>
    tryDb(() => db.select().from(organizations)).pipe(
      Effect.map((rows) =>
        (rows as Record<string, unknown>[]).map(stripNulls<Organization>),
      ),
    ),

  get: (id) =>
    Effect.gen(function* () {
      const row = yield* findOne(id)
      if (!row) return yield* Effect.fail(new OrganizationNotFound({ id }))
      return stripNulls<Organization>(row)
    }),

  create: (org) =>
    // The service does a pre-flight uniqueness check for nice errors; this
    // `catch` is the race-safe fallback — if two concurrent creates slip
    // past the check, MySQL's UNIQUE index wins and we surface the same
    // domain error instead of a generic 500.
    Effect.tryPromise({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try: () => db.insert(organizations).values(org as any),
      catch: (cause) =>
        isUniqueViolationError(cause)
          ? new OrganizationNameTaken({ name: org.name })
          : new StorageError({ cause }),
    }).pipe(Effect.as(org)),

  update: (id, patch) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing)
        return yield* Effect.fail(new OrganizationNotFound({ id }))
      yield* Effect.tryPromise({
        try: () =>
          db
            .update(organizations)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set(patch as any)
            .where(eq(organizations.id, id)),
        catch: (cause) =>
          isUniqueViolationError(cause) && typeof patch.name === "string"
            ? new OrganizationNameTaken({ name: patch.name })
            : new StorageError({ cause }),
      })
      const updated = yield* findOne(id)
      return stripNulls<Organization>(updated as Record<string, unknown>)
    }),

  remove: (id) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing)
        return yield* Effect.fail(new OrganizationNotFound({ id }))
      yield* Effect.tryPromise({
        try: () =>
          db.delete(organizations).where(eq(organizations.id, id)),
        catch: (cause) =>
          isFkReferencedError(cause)
            ? new OrganizationInUse({ id })
            : new StorageError({ cause }),
      })
    }),
}
