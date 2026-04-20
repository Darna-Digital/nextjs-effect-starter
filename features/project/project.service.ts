import { Context, Effect } from "effect"
import type { Storage } from "@/lib/effect/layers/storage/storage.base"
import { Organizations } from "@/features/organization/organization.service"
import { CurrentUser } from "@/lib/effect/layers/auth"
import type { UserId } from "@/features/auth/auth.model"
import {
  ProjectNotFound,
  type Project,
  type ProjectId,
} from "./project.model"
import type { CreateProject, UpdateProject } from "./project.requests"

export class ProjectStorage extends Context.Tag("ProjectStorage")<
  ProjectStorage,
  Storage<Project>
>() {}

/**
 * Projects service.
 *
 * Dependencies visible in the `R` channel:
 *   - `ProjectStorage`   — where projects live
 *   - `CurrentUser`      — who is making the request (read implicitly)
 *   - `Organizations`    — to verify the target org exists
 *   - `Tracer`, `Logger` — cross-cutting observability
 *
 * Storage errors are translated to domain errors inline via
 * `Effect.catchTag` — TypeScript only infers the `Id` brand when the
 * source effect is concrete in the pipe chain.
 */
export class Projects extends Effect.Service<Projects>()("Projects", {
  accessors: true,
  effect: Effect.gen(function* () {
    const storage = yield* ProjectStorage

    return {
      getAll: () => storage.getAll().pipe(Effect.withSpan("Projects.getAll")),

      getById: (id: ProjectId) =>
        storage.getById(id).pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(new ProjectNotFound({ id: e.id })),
          ),
          Effect.withSpan("Projects.getById", {
            attributes: { "project.id": id },
          }),
        ),

      create: (input: CreateProject) =>
        Effect.gen(function* () {
          // 1. Who is making this request? Pulled from context, not params.
          //    This is Effect DI in action — identity is a dependency.
          const user = yield* CurrentUser

          // 2. Cross-service call: verify the target org exists.
          //    Fails with OrganizationNotFound which bubbles up the stack.
          yield* Organizations.getById(input.organizationId)

          // 3. Structured log, correlated to the current span automatically.
          yield* Effect.logInfo("Creating project").pipe(
            Effect.annotateLogs({
              "user.id": user.id,
              "organization.id": input.organizationId,
              "project.name": input.name,
            }),
          )

          return yield* storage.create({
            id: crypto.randomUUID() as ProjectId,
            // `CurrentUser` has a generic `id: string` in `lib/` (no feature
            // imports). At runtime it's always a UserId — produced by
            // `Auth.verifyToken` on the way in. Cast once, here.
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
        storage.update(id, input).pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(new ProjectNotFound({ id: e.id })),
          ),
          Effect.withSpan("Projects.update", {
            attributes: { "project.id": id },
          }),
        ),

      remove: (id: ProjectId) =>
        storage.remove(id).pipe(
          Effect.catchTag("EntityNotFound", (e) =>
            Effect.fail(new ProjectNotFound({ id: e.id })),
          ),
          Effect.withSpan("Projects.remove", {
            attributes: { "project.id": id },
          }),
        ),
    }
  }),
}) {}
