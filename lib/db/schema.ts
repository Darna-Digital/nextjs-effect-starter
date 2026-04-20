import { relations } from "drizzle-orm"
import { mysqlTable, varchar } from "drizzle-orm/mysql-core"
import type { OrganizationId } from "@/features/organization/schema/organization.schema.model"
import type { ProjectId } from "@/features/project/schema/project.schema.model"
import type { UserId } from "@/features/auth/schema/auth.schema.model"

/**
 * MySQL tables for the whole app. Features don't import from here; only
 * the feature's `*.layers.live.ts` adapter does. This keeps model/service
 * code storage-agnostic — the only coupling back to features is the
 * branded ID types, which are pure TypeScript brands with no runtime cost.
 *
 * `.$type<XxxId>()` preserves each brand through Drizzle inference: the
 * DB column is plain `varchar`, but TypeScript sees it as the branded ID
 * end-to-end.
 */

// ─────────────────────────────────────────────────────────────────────────────
// organizations
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$type<OrganizationId>(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
})

// ─────────────────────────────────────────────────────────────────────────────
// projects — belongs to an organization
// ─────────────────────────────────────────────────────────────────────────────

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().$type<ProjectId>(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
  organizationId: varchar("organization_id", { length: 36 })
    .notNull()
    .references(() => organizations.id)
    .$type<OrganizationId>(),
  ownerId: varchar("owner_id", { length: 36 })
    .notNull()
    .references(() => users.id)
    .$type<UserId>(),
  // ISO 8601 string to match the domain's `createdAt: S.String`. Swap to
  // `datetime` (with conversion) if SQL-level date queries are needed.
  createdAt: varchar("created_at", { length: 32 }).notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// users
// ─────────────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$type<UserId>(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
})

// ─────────────────────────────────────────────────────────────────────────────
// refresh_tokens — one row per active session; rotated on each use.
// The primary key IS the secret token value — no separate id column.
// ─────────────────────────────────────────────────────────────────────────────

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id)
    .$type<UserId>(),
  expiresAt: varchar("expires_at", { length: 32 }).notNull(),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
})

/** Teaches `db.query.projects.findMany({ with: { organization: true } })` how to join. */
export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
}))
