import { Context, Effect } from "effect";
import { CurrentUser } from "@/lib/effect/layers/auth";
import { Organizations } from "@/features/organization/service/organization.service";
import { type ProjectId } from "@/features/project/schema/project.schema.model";
import {
  ProjectRepository,
  type ProjectFilter,
} from "@/features/project/repository/project.repository";
import { ProvisioningClient } from "@/features/provisioning/client/provisioning.client";
import type {
  CreateProject,
  UpdateProject,
} from "@/features/project/schema/project.schema.requests";

const make = Effect.gen(function* () {
  const repo = yield* ProjectRepository;
  const provisioning = yield* ProvisioningClient;

  return {
    list: (filter: ProjectFilter = {}) =>
      repo.list(filter).pipe(
        Effect.withSpan("Projects.list", {
          attributes: {
            "filter.ownerId": filter.ownerId,
            "filter.organizationId": filter.organizationId,
          },
        }),
      ),

    mine: () =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        return yield* repo.list({ ownerId: user.id });
      }).pipe(Effect.withSpan("Projects.mine")),

    getById: (id: ProjectId) =>
      repo.get(id).pipe(
        Effect.withSpan("Projects.getById", {
          attributes: { "project.id": id },
        }),
      ),

    create: (input: CreateProject) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        const organizations = yield* Organizations;

        yield* organizations.getById(input.organizationId);

        yield* Effect.logInfo("Creating project").pipe(
          Effect.annotateLogs({
            "user.id": user.id,
            "organization.id": input.organizationId,
            "project.name": input.name,
          }),
        );

        const created = yield* repo.create({
          id: crypto.randomUUID() as ProjectId,
          ownerId: user.id,
          status: "provisioning",
          createdAt: new Date().toISOString(),
          ...input,
        });

        // Kick off the durable provisioning workflow (best-effort — does not
        // block or fail creation if the world is unavailable).
        yield* provisioning.start(created.id);

        return created;
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
  };
});

export class Projects extends Context.Service<
  Projects,
  Effect.Success<typeof make>
>()("Projects", { make }) {}
