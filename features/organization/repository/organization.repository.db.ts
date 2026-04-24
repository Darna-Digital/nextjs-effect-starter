import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { organizations } from "@/lib/db/schema"
import {
  DB_SPAN_ATTRS,
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
  tryDb("mysql.organizations.findOne", () =>
    db.select().from(organizations).where(eq(organizations.id, id)).limit(1),
  ).pipe(Effect.map((rows) => rows[0] ?? null))

export const createDbOrganizationRepository: OrganizationRepo = {
  list: () =>
    tryDb("mysql.organizations.list", () =>
      db.select().from(organizations),
    ).pipe(Effect.map((rows) => rows.map((r) => stripNulls<Organization>(r)))),

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
      try: () => db.insert(organizations).values(org),
      catch: (cause) =>
        isUniqueViolationError(cause)
          ? new OrganizationNameTaken({ name: org.name })
          : new StorageError({ cause }),
    })
      .pipe(
        Effect.withSpan("mysql.organizations.insert", {
          attributes: DB_SPAN_ATTRS,
        }),
      )
      .pipe(Effect.as(org)),

  update: (id, patch) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing)
        return yield* Effect.fail(new OrganizationNotFound({ id }))
      yield* Effect.tryPromise({
        try: () =>
          db
            .update(organizations)
            .set(patch)
            .where(eq(organizations.id, id)),
        catch: (cause) =>
          isUniqueViolationError(cause) && typeof patch.name === "string"
            ? new OrganizationNameTaken({ name: patch.name })
            : new StorageError({ cause }),
      }).pipe(
        Effect.withSpan("mysql.organizations.update", {
          attributes: DB_SPAN_ATTRS,
        }),
      )
      const updated = yield* findOne(id)
      if (!updated) return yield* Effect.fail(new OrganizationNotFound({ id }))
      return stripNulls<Organization>(updated)
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
      }).pipe(
        Effect.withSpan("mysql.organizations.delete", {
          attributes: DB_SPAN_ATTRS,
        }),
      )
    }),
}
