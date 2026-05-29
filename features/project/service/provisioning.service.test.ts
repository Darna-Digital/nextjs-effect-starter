import { beforeEach, describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Provisioning } from "@/features/project/service/provisioning.service";
import { ProjectRepository } from "@/features/project/repository/project.repository";
import { createMemoryProjectRepository } from "@/features/project/repository/project.repository.memory";
import { Email } from "@/lib/effect/layers/email";
import type { SendEmailInput } from "@/lib/auth/email";
import type {
  Project,
  ProjectId,
} from "@/features/project/schema/project.schema.model";
import type { OrganizationId } from "@/features/organization/schema/organization.schema.model";

// Recording Email layer: capture what `notifyOwner` would deliver so tests can
// assert on it without touching a real mailer or the console.
const sent: SendEmailInput[] = [];
const EmailRecorder = Layer.succeed(Email, {
  send: (input) =>
    Effect.sync(() => {
      sent.push(input);
    }),
});
beforeEach(() => {
  sent.length = 0;
});

const pending: Project = {
  id: "p-1" as ProjectId,
  name: "Alpha",
  organizationId: "org-a" as OrganizationId,
  ownerId: "owner@example.com",
  status: "provisioning",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const missing = "p-missing" as ProjectId;

// Provide Provisioning over a memory repo + recording mailer, keeping the repo
// in the output context too so tests can read back what a step wrote.
const env = (seed: readonly Project[]) =>
  Layer.effect(Provisioning, Provisioning.make).pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        Layer.effect(ProjectRepository, createMemoryProjectRepository(seed)),
        EmailRecorder,
      ),
    ),
  );

describe("Provisioning.activate", () => {
  it.effect("flips a provisioning project to active", () =>
    Effect.gen(function* () {
      const provisioning = yield* Provisioning;
      const repo = yield* ProjectRepository;
      yield* provisioning.activate(pending.id);
      const updated = yield* repo.get(pending.id);
      expect(updated.status).toBe("active");
    }).pipe(Effect.provide(env([pending]))),
  );

  it.effect("fails with ProjectNotFound for an unknown project", () =>
    Effect.gen(function* () {
      const provisioning = yield* Provisioning;
      const error = yield* Effect.flip(provisioning.activate(missing));
      expect(error._tag).toBe("ProjectNotFound");
    }).pipe(Effect.provide(env([]))),
  );
});

describe("Provisioning.notifyOwner", () => {
  it.effect("emails the owner that the project is ready", () =>
    Effect.gen(function* () {
      const provisioning = yield* Provisioning;
      yield* provisioning.notifyOwner(pending.id);
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe(pending.ownerId);
      expect(sent[0].subject).toContain(pending.name);
      expect(sent[0].text).toContain(pending.id);
    }).pipe(Effect.provide(env([pending]))),
  );

  it.effect("fails with ProjectNotFound and sends no email", () =>
    Effect.gen(function* () {
      const provisioning = yield* Provisioning;
      const error = yield* Effect.flip(provisioning.notifyOwner(missing));
      expect(error._tag).toBe("ProjectNotFound");
      expect(sent).toHaveLength(0);
    }).pipe(Effect.provide(env([]))),
  );
});
