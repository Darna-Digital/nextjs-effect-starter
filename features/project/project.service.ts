import { Context, Effect } from "effect";
import {
  mapNotFound,
  type Storage,
} from "@/layers/storage/storage";
import { Organizations } from "@/features/organization/organization.service";
import { CurrentUser } from "@/lib/auth";
import {
  ProjectNotFound,
  type Project,
  type ProjectId,
} from "./project.model";
import type { CreateProject, UpdateProject } from "./project.requests";

/** Storage backend for projects. */
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
 * None of these are parameters. Effect threads them through the context.
 */
export class Projects extends Effect.Service<Projects>()("Projects", {
  accessors: true,
  effect: Effect.gen(function* () {
    const storage = yield* ProjectStorage;

    const toNotFound = mapNotFound(
      (id: ProjectId) => new ProjectNotFound({ id }),
    );

    return {
      getAll: () => storage.getAll().pipe(Effect.withSpan("Projects.getAll")),

      getById: (id: ProjectId) =>
        storage.getById(id).pipe(
          toNotFound,
          Effect.withSpan("Projects.getById", {
            attributes: { "project.id": id },
          }),
        ),

      create: (input: CreateProject) =>
        Effect.gen(function* () {
          // 1. Who is making this request? Pulled from context, not params.
          const user = yield* CurrentUser;

          // 2. Cross-service call: verify the target org exists.
          //    Fails with OrganizationNotFound which bubbles up the stack.
          yield* Organizations.getById(input.organizationId);

          // 3. Structured log, correlated to the current span automatically.
          yield* Effect.logInfo("Creating project").pipe(
            Effect.annotateLogs({
              "user.id": user.id,
              "organization.id": input.organizationId,
              "project.name": input.name,
            }),
          );

          return yield* storage.create({
            id: crypto.randomUUID() as ProjectId,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            ...input,
          });
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
          toNotFound,
          Effect.withSpan("Projects.update", {
            attributes: { "project.id": id },
          }),
        ),

      remove: (id: ProjectId) =>
        storage.remove(id).pipe(
          toNotFound,
          Effect.withSpan("Projects.remove", {
            attributes: { "project.id": id },
          }),
        ),
    };
  }),
}) {}
