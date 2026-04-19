import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// drizzle-kit runs outside of Next.js, so we load env ourselves.
config({ path: ".env.local" })

export default defineConfig({
  dialect: "mysql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
})
