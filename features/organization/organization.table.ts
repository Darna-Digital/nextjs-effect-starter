import { mysqlTable, varchar } from "drizzle-orm/mysql-core"
import type { OrganizationId } from "./organization.model"

/**
 * MySQL table for organizations.
 *
 * `.$type<OrganizationId>()` preserves the brand through Drizzle's type
 * inference — the DB column is plain `varchar` but TypeScript sees it
 * as `OrganizationId`, same as the domain model.
 */
export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey().$type<OrganizationId>(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1024 }),
})
