import { Effect } from "effect"
import { CurrentUser } from "@/lib/effect/layers/auth"
import type { UserId } from "@/features/auth/schema/auth.schema.model"
import { Organizations } from "@/features/organization/service/organization.service"
import { type ProjectId } from "@/features/project/schema/project.schema.model"
import {
  ProjectRepository,
  type ProjectFilter,
} from "@/features/project/repository/project.repository"
import type { CreateProject, UpdateProject } from "@/features/project/schema/project.schema.requests"

/**
 * Projects service.
 *
 * Dependencies visible in the `R` channel:
 *   - `ProjectRepository` — feature-level repo (filterable `list`, domain errors)
 *   - `CurrentUser`       — the requesting user, pulled from context
 *   - `Organizations`     — to verify the target org exists
 *   - `Tracer`, `Logger`  — cross-cutting observability
 *
 * Rails-style scopes (filter-aware `list`, `mine`) live here; the repo is a
 * thin translation layer to Drizzle or an in-memory `Ref`. No generic
 * `Storage<T>` straitjacket.
 */
export class Projects extends Effect.Service<Projects>()("Projects", {
  accessors: true,
  effect: Effect.gen(function* () {
    const repo = yield* ProjectRepository

    return {
      /** Filterable list. `{}` means "every project." */
      list: (filter: ProjectFilter = {}) =>
        repo.list(filter).pipe(
          Effect.withSpan("Projects.list", {
            attributes: {
              "filter.ownerId": filter.ownerId,
              "filter.organizationId": filter.organizationId,
            },
          }),
        ),

      /** Projects owned by the requesting user — classic Rails `current_user.projects`. */
      mine: () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser
          return yield* repo.list({ ownerId: user.id as UserId })
        }).pipe(Effect.withSpan("Projects.mine")),

      getById: (id: ProjectId) =>
        repo.get(id).pipe(
          Effect.withSpan("Projects.getById", {
            attributes: { "project.id": id },
          }),
        ),

      create: (input: CreateProject) =>
        Effect.gen(function* () {
          // 1. Who is making this request? Pulled from context, not params.
          //    This is Effect DI — identity is a typed dependency.
          const user = yield* CurrentUser

          // 2. Cross-service call: verify the target org exists.
          yield* Organizations.getById(input.organizationId)

          // 3. Structured log, correlated to the current span automatically.
          yield* Effect.logInfo("Creating project").pipe(
            Effect.annotateLogs({
              "user.id": user.id,
              "organization.id": input.organizationId,
              "project.name": input.name,
            }),
          )

          return yield* repo.create({
            id: crypto.randomUUID() as ProjectId,
            // `CurrentUser` has a generic `id: string` in `lib/`. At runtime
            // it's always a UserId — produced by `Auth.verifyToken`.
            ownerId: user.id as UserId,
            createdAt: new Date().toISOString(),
            ...input,
          })
        }).pipe(
          Effect.withSpan("Projects.create", {
            attributes: {
              "project.name": input.name,
              "organization.id": input.organizationId,
            },
          }),
        ),

      update: (id: ProjectId, input: UpdateProject) =>
        repo.update(id, input).pipe(
          Effect.withSpan("Projects.update", {
            attributes: { "project.id": id },
          }),
        ),

      remove: (id: ProjectId) =>
        repo.remove(id).pipe(
          Effect.withSpan("Projects.remove", {
            attributes: { "project.id": id },
          }),
        ),
    }
  }),
}) {}
