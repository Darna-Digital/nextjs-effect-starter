import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside of Next.js, so we load env ourselves.
config({ path: ".env.local" });

/**
 * Manages the Workflow SDK's MySQL world tables (the `workflow` schema), copied
 * locally in `lib/db/workflow-schema.ts`. Kept separate from the app's
 * `drizzle.config.ts` so the two schemas migrate independently.
 *
 * The connection points at the `workflow` database directly (not the app's
 * `learning_effect`) so introspection is scoped to it and never touches the
 * app's tables. Run via `pnpm world:generate` then `pnpm world:setup`.
 */
const workflowUrl = (() => {
  const url = new URL(process.env.DATABASE_URL!);
  url.pathname = "/workflow";
  return url.toString();
})();

export default defineConfig({
  dialect: "mysql",
  schema: "./lib/db/workflow-schema.ts",
  out: "./lib/db/workflow-migrations",
  dbCredentials: {
    url: workflowUrl,
  },
  verbose: true,
});
