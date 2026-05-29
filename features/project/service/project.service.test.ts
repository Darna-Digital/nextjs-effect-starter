import { describe, it, expect } from "vitest";
import { Effect, Layer, Result } from "effect";
import { Projects } from "@/features/project/service/project.service";
import { ProjectsMemory } from "@/features/project/layer/project.layer.memory";
import { OrganizationsMemory } from "@/features/organization/layer/organization.layer.memory";
import { Organizations } from "@/features/organization/service/organization.service";
import { CurrentUser, type User } from "@/lib/effect/layers/auth";
import type {
  CreateProject,
  ListProjectsQuerySchema,
} from "@/features/project/schema/project.schema.requests";
import type {
  Project,
  ProjectId,
} from "@/features/project/schema/project.schema.model";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model";

// v4 services expose no static accessors; access via the service instance.
const createProject = (input: CreateProject) =>
  Effect.flatMap(Projects, (s) => s.create(input));
const listProjects = (filter?: typeof ListProjectsQuerySchema.Type) =>
  Effect.flatMap(Projects, (s) => s.list(filter));
const mineProjects = () => Effect.flatMap(Projects, (s) => s.mine());

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

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
};

function run<Success, Failure>(
  effect: Effect.Effect<Success, Failure, Projects | Organizations | CurrentUser>,
  options?: {
    projects?: readonly Project[];
    organizations?: readonly Organization[];
    user?: User;
  },
) {
  return Effect.runPromise(
    effect.pipe(
      Effect.result,
      Effect.provide(
        Layer.mergeAll(
          ProjectsMemory({ seed: options?.projects ?? [] }),
          OrganizationsMemory({ seed: options?.organizations ?? [] }),
          Layer.succeed(CurrentUser, options?.user ?? alice),
        ),
      ),
    ),
  );
}

describe("Projects.create", () => {
  it("fails when the target organization does not exist", async () => {
    const result = await run(
      createProject({
        name: "Alpha",
        organizationId: "nonexistent" as OrganizationId,
      }),
    );
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result)) {
      expect((result.failure as { _tag: string })._tag).toBe(
        "OrganizationNotFound",
      );
    }
  });

  it("creates a project when the organization exists", async () => {
    const result = await run(
      createProject({ name: "Alpha", organizationId: orgA.id }),
      { organizations: [orgA] },
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.name).toBe("Alpha");
      expect(result.success.organizationId).toBe(orgA.id);
    }
  });

  it("stamps the current user as the owner — identity comes from context", async () => {
    const asAlice = await run(
      createProject({ name: "Alpha", organizationId: orgA.id }),
      { organizations: [orgA], user: alice },
    );
    const asBob = await run(
      createProject({ name: "Beta", organizationId: orgA.id }),
      { organizations: [orgA], user: bob },
    );

    expect(Result.isSuccess(asAlice) && asAlice.success.ownerId).toBe(alice.id);
    expect(Result.isSuccess(asBob) && asBob.success.ownerId).toBe(bob.id);
  });
});

const orgB: Organization = {
  id: "org-b" as OrganizationId,
  name: "Globex",
};

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
  it("returns everything with no filter", async () => {
    const result = await run(listProjects(), { projects: seed });
    expect(Result.isSuccess(result) && result.success.length).toBe(3);
  });

  it("filters by ownerId", async () => {
    const result = await run(listProjects({ ownerId: alice.id }), {
      projects: seed,
    });
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        aliceInB.id,
      ]);
    }
  });

  it("filters by organizationId", async () => {
    const result = await run(listProjects({ organizationId: orgA.id }), {
      projects: seed,
    });
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        bobInA.id,
      ]);
    }
  });

  it("intersects filters (ownerId AND organizationId)", async () => {
    const result = await run(
      listProjects({
        ownerId: alice.id,
        organizationId: orgA.id,
      }),
      { projects: seed },
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.map((p) => p.id)).toEqual([aliceInA.id]);
    }
  });
});

describe("Projects.mine", () => {
  it("returns only the requesting user's projects — identity from context", async () => {
    const asAlice = await run(mineProjects(), {
      projects: seed,
      user: alice,
    });
    const asBob = await run(mineProjects(), {
      projects: seed,
      user: bob,
    });

    expect(Result.isSuccess(asAlice)).toBe(true);
    if (Result.isSuccess(asAlice)) {
      expect(asAlice.success.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        aliceInB.id,
      ]);
    }
    expect(Result.isSuccess(asBob)).toBe(true);
    if (Result.isSuccess(asBob)) {
      expect(asBob.success.map((p) => p.id)).toEqual([bobInA.id]);
    }
  });
});
