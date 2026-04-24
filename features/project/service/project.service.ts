import { Effect } from "effect";
import { CurrentUser } from "@/lib/effect/layers/auth";
import { Organizations } from "@/features/organization/service/organization.service";
import { type ProjectId } from "@/features/project/schema/project.schema.model";
import {
  ProjectRepository,
  type ProjectFilter,
} from "@/features/project/repository/project.repository";
import type {
  CreateProject,
  UpdateProject,
} from "@/features/project/schema/project.schema.requests";

export class Projects extends Effect.Service<Projects>()("Projects", {
  accessors: true,
  effect: Effect.gen(function* () {
    const repo = yield* ProjectRepository;

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

          yield* Organizations.getById(input.organizationId);

          yield* Effect.logInfo("Creating project").pipe(
            Effect.annotateLogs({
              "user.id": user.id,
              "organization.id": input.organizationId,
              "project.name": input.name,
            }),
          );

          return yield* repo.create({
            id: crypto.randomUUID() as ProjectId,
            ownerId: user.id,
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
  }),
}) {}
