import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Projects } from "@/features/project/service/project.service";
import { ProjectsMemory } from "@/features/project/layer/project.layer.memory";
import { OrganizationsMemory } from "@/features/organization/layer/organization.layer.memory";
import { CurrentUser, type User } from "@/lib/effect/layers/auth";
import type {
  Project,
  ProjectId,
} from "@/features/project/schema/project.schema.model";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model";

const mkUser = (id: string, email: string): User => ({
  id,
  email,
  name: email.split("@")[0],
  emailVerified: true,
  image: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const alice: User = mkUser("user-alice", "alice@example.com");
const bob: User = mkUser("user-bob", "bob@example.com");

const orgA: Organization = { id: "org-a" as OrganizationId, name: "Acme" };
const orgB: Organization = { id: "org-b" as OrganizationId, name: "Globex" };

const env = (opts?: {
  projects?: readonly Project[];
  organizations?: readonly Organization[];
  user?: User;
}) =>
  Layer.mergeAll(
    ProjectsMemory({ seed: opts?.projects ?? [] }),
    OrganizationsMemory({ seed: opts?.organizations ?? [] }),
    Layer.succeed(CurrentUser, opts?.user ?? alice),
  );

describe("Projects.create", () => {
  it.effect("fails when the target organization does not exist", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const error = yield* Effect.flip(
        projects.create({
          name: "Alpha",
          organizationId: "nonexistent" as OrganizationId,
        }),
      );
      expect((error as { _tag: string })._tag).toBe("OrganizationNotFound");
    }).pipe(Effect.provide(env())),
  );

  it.effect("creates a project when the organization exists", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const created = yield* projects.create({
        name: "Alpha",
        organizationId: orgA.id,
      });
      expect(created.name).toBe("Alpha");
      expect(created.organizationId).toBe(orgA.id);
    }).pipe(Effect.provide(env({ organizations: [orgA] }))),
  );

  it.effect("stamps the current user as the owner — identity from context", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const created = yield* projects.create({
        name: "Alpha",
        organizationId: orgA.id,
      });
      expect(created.ownerId).toBe(bob.id);
    }).pipe(Effect.provide(env({ organizations: [orgA], user: bob }))),
  );
});

const aliceInA: Project = {
  id: "p-1" as ProjectId,
  name: "Alice at A",
  organizationId: orgA.id,
  ownerId: alice.id,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const aliceInB: Project = {
  id: "p-2" as ProjectId,
  name: "Alice at B",
  organizationId: orgB.id,
  ownerId: alice.id,
  createdAt: "2026-01-02T00:00:00.000Z",
};
const bobInA: Project = {
  id: "p-3" as ProjectId,
  name: "Bob at A",
  organizationId: orgA.id,
  ownerId: bob.id,
  createdAt: "2026-01-03T00:00:00.000Z",
};

const seed = [aliceInA, aliceInB, bobInA];

describe("Projects.list", () => {
  it.effect("returns everything with no filter", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const all = yield* projects.list();
      expect(all.length).toBe(3);
    }).pipe(Effect.provide(env({ projects: seed }))),
  );

  it.effect("filters by ownerId", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const mine = yield* projects.list({ ownerId: alice.id });
      expect(mine.map((p) => p.id).sort()).toEqual([aliceInA.id, aliceInB.id]);
    }).pipe(Effect.provide(env({ projects: seed }))),
  );

  it.effect("filters by organizationId", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const inA = yield* projects.list({ organizationId: orgA.id });
      expect(inA.map((p) => p.id).sort()).toEqual([aliceInA.id, bobInA.id]);
    }).pipe(Effect.provide(env({ projects: seed }))),
  );

  it.effect("intersects filters (ownerId AND organizationId)", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const both = yield* projects.list({
        ownerId: alice.id,
        organizationId: orgA.id,
      });
      expect(both.map((p) => p.id)).toEqual([aliceInA.id]);
    }).pipe(Effect.provide(env({ projects: seed }))),
  );
});

describe("Projects.mine", () => {
  it.effect("returns only alice's projects — identity from context", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const mine = yield* projects.mine();
      expect(mine.map((p) => p.id).sort()).toEqual([aliceInA.id, aliceInB.id]);
    }).pipe(Effect.provide(env({ projects: seed, user: alice }))),
  );

  it.effect("returns only bob's projects — identity from context", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const mine = yield* projects.mine();
      expect(mine.map((p) => p.id)).toEqual([bobInA.id]);
    }).pipe(Effect.provide(env({ projects: seed, user: bob }))),
  );
});
