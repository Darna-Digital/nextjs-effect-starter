import { Effect } from "effect"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { projects } from "@/lib/db/schema"
import { stripNulls, tryDb } from "@/lib/effect/layers/storage"
import { ProjectNotFound, type Project } from "@/features/project/schema/project.schema.model"
import type { ProjectRepo } from "@/features/project/repository/project.repository"

const findOne = (id: Project["id"]) =>
  tryDb("mysql.projects.findOne", () =>
    db.select().from(projects).where(eq(projects.id, id)).limit(1),
  ).pipe(Effect.map((rows) => rows[0] ?? null))

/**
 * MySQL-backed `ProjectRepository`. Every query is wrapped in an OTel
 * span so traces show the database hop, not just the service call.
 */
export const createDbProjectRepository: ProjectRepo = {
  list: (filter = {}) =>
    tryDb("mysql.projects.list", () => {
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
    }).pipe(Effect.map((rows) => rows.map((r) => stripNulls<Project>(r)))),

  get: (id) =>
    Effect.gen(function* () {
      const row = yield* findOne(id)
      if (!row) return yield* Effect.fail(new ProjectNotFound({ id }))
      return stripNulls<Project>(row)
    }),

  create: (project) =>
    tryDb("mysql.projects.insert", () =>
      db.insert(projects).values(project),
    ).pipe(Effect.as(project)),

  update: (id, patch) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing) return yield* Effect.fail(new ProjectNotFound({ id }))
      yield* tryDb("mysql.projects.update", () =>
        db.update(projects).set(patch).where(eq(projects.id, id)),
      )
      const updated = yield* findOne(id)
      if (!updated) return yield* Effect.fail(new ProjectNotFound({ id }))
      return stripNulls(updated)
    }),

  remove: (id) =>
    Effect.gen(function* () {
      const existing = yield* findOne(id)
      if (!existing) return yield* Effect.fail(new ProjectNotFound({ id }))
      yield* tryDb("mysql.projects.delete", () =>
        db.delete(projects).where(eq(projects.id, id)),
      )
    }),
}
