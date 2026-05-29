import { Context, Effect } from "effect";
import { Email } from "@/lib/effect/layers/email";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import type { ProjectId } from "@/features/project/schema/project.schema.model";

/**
 * Business logic for the project-provisioning workflow's steps. It is a regular
 * Effect service (depends on {@link ProjectRepository}) so the durable workflow
 * benefits from the same dependency injection as the rest of the backend — the
 * `"use step"` adapters in `provisioning.workflow.ts` are thin shells that run
 * these effects through a {@link ManagedRuntime}.
 *
 * Note: no `CurrentUser` dependency — steps run in the world's queue worker,
 * outside any HTTP request, so there is no authenticated user in context.
 */
const make = Effect.gen(function* () {
  const repo = yield* ProjectRepository;
  const email = yield* Email;

  return {
    /** Flip a freshly-created project from "provisioning" to "active". */
    activate: (id: ProjectId) =>
      repo.update(id, { status: "active" }).pipe(
        Effect.asVoid,
        Effect.withSpan("Provisioning.activate", {
          attributes: { "project.id": id },
        }),
      ),

    /** Notify the project owner that provisioning has completed. */
    notifyOwner: (id: ProjectId) =>
      Effect.gen(function* () {
        const project = yield* repo.get(id);
        yield* email.send({
          to: project.ownerId,
          subject: `Project "${project.name}" is ready`,
          text: `Your project "${project.name}" (${project.id}) has finished provisioning and is now active.`,
        });
        yield* Effect.logInfo("Project provisioning notification sent").pipe(
          Effect.annotateLogs({
            "project.id": id,
            "owner.id": project.ownerId,
          }),
        );
      }).pipe(
        Effect.withSpan("Provisioning.notifyOwner", {
          attributes: { "project.id": id },
        }),
      ),
  };
});

export class Provisioning extends Context.Service<
  Provisioning,
  Effect.Success<typeof make>
>()("Provisioning", { make }) {}
