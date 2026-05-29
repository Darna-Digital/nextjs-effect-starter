import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

function createClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and start MySQL with `docker-compose up -d mysql`.",
    );
  }
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
  });
  return drizzle(pool, { schema, mode: "default" });
}

let instance: ReturnType<typeof createClient> | undefined;

/**
 * Lazy drizzle client: the pool is created (and `DATABASE_URL` validated) on
 * first use, not at import. This keeps importing modules that merely reference
 * the db — e.g. a workflow's step graph pulled in by the projects service —
 * side-effect-free, so unit tests don't need a database.
 */
export const db: ReturnType<typeof createClient> = new Proxy(
  {} as ReturnType<typeof createClient>,
  {
    get(_target, prop) {
      instance ??= createClient();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
    has(_target, prop) {
      instance ??= createClient();
      return prop in instance;
    },
  },
);

export type Db = typeof db;
