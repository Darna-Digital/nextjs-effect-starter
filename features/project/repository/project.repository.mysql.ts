import { Effect } from "effect"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { projects } from "@/lib/db/schema"
import { stripNulls, tryDb } from "@/lib/effect/layers/storage"
import { ProjectNotFound, type Project } from "@/features/project/schema/project.schema.model"
import type { ProjectRepo } from "@/features/project/repository/project.repository"

const findOne = (id: Project["id"]) =>
  tryDb(() =>
    db.select().from(projects).where(eq(projects.id, id)).limit(1),
  ).pipe(Effect.map((rows) => (rows[0] as Record<string, unknown>) ?? null))

/**
 * MySQL-backed `ProjectRepository`. Filtering is pushed down to SQL so
 * large tables don't force the server to fetch-then-filter.
 */
export const mysqlProjectRepository: ProjectRepo = {
  list: (filter = {}) =>
    tryDb(() => {
      const conditions = []
      if (filter.ownerId) conditions.push(eq(projects.ownerId, filter.ownerId))
      if (filter.organizationId)
        conditions.push(eq(projects.organizationId, filter.organizationId))
      return conditions.length > 0
        ? db
            .select()
            .from(projects)
            .where(and(...conditions))
        : db.select().from(projects)
    }).pipe(
      Effect.map((rows) =>
        (rows as Record<string, unknown>[]).map(stripNulls<Project>),
      ),
    ),

  get: (id) =>
    Effect.gen(function* () {
      const row = yield* findOne(id)
      if (!row) return yield* Effect.fail(new ProjectNotFound({ id }))
      return stripNulls<Project>(row)
    }),

  create: (project) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tryDb(() => db.insert(projects).values(project as any)).pipe(
      Effect.as(project),
    ),

  update: (id, patch) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing) return yield* Effect.fail(new ProjectNotFound({ id }))
      yield* tryDb(() =>
        db
          .update(projects)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set(patch as any)
          .where(eq(projects.id, id)),
      )
      const updated = yield* findOne(id)
      return stripNulls<Project>(updated as Record<string, unknown>)
    }),

  remove: (id) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing) return yield* Effect.fail(new ProjectNotFound({ id }))
      yield* tryDb(() => db.delete(projects).where(eq(projects.id, id)))
    }),
}
