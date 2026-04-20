import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import { config } from "@/lib/effect/config"
import * as schema from "./schema"

/**
 * Shared MySQL connection pool. Next.js reuses this module across requests,
 * so the pool is created once per Node process.
 */
const pool = mysql.createPool({
  uri: config.databaseUrl,
  connectionLimit: 10,
})

/**
 * The Drizzle client. Exports typed `.query.organizations`, `.query.projects`,
 * etc. via the `schema` barrel.
 */
export const db = drizzle(pool, { schema, mode: "default" })

/** Type of the Drizzle client — used where we pass `db` around. */
export type Db = typeof db
