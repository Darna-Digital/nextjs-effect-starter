import { relations } from "drizzle-orm"
import { mysqlTable, varchar } from "drizzle-orm/mysql-core"
import { organizations } from "@/features/organization/organization.table"
import type { OrganizationId } from "@/features/organization/organization.model"
import type { ProjectId } from "./project.model"

/**
 * MySQL table for projects.
 *
 * `organizationId` is the foreign key — this is what the domain model's
 * `organizationId: OrganizationId` field maps to at the storage layer.
 * `references(...)` tells MySQL to enforce the FK constraint.
 */
export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().$type<ProjectId>(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
  organizationId: varchar("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id)
    .$type<OrganizationId>(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  // ISO 8601 string to match the domain's `createdAt: S.String` — pragmatic
  // for this demo. Migrate to `datetime` (with conversion) if SQL-level
  // date queries are needed.
  createdAt: varchar("created_at", { length: 32 }).notNull(),
})

/**
 * Drizzle relations — teaches the query builder how to join.
 * Not a column, not a constraint; purely for `db.query.projects.findMany({ with: { organization: true } })`.
 */
export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
}))
