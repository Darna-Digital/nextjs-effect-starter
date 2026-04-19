/**
 * Aggregate schema for drizzle-kit.
 *
 * Each feature owns its own `*.table.ts` file — this barrel just re-exports
 * them so `drizzle-kit push/generate/studio` can find everything in one place.
 */

export * from "@/features/organization/organization.table"
export * from "@/features/project/project.table"
