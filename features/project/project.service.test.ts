import { describe, it, expect } from "vitest";
import { Effect, Either, Layer } from "effect";
import { Projects } from "./project.service";
import { ProjectsMemory } from "./project.layers.memory";
import { OrganizationsMemory } from "@/features/organization/organization.layers.memory";
import { Organizations } from "@/features/organization/organization.service";
import { CurrentUser, type User } from "@/lib/effect/layers/auth";
import type { Project, ProjectId } from "./project.model";
import type { UserId } from "@/features/auth/auth.model";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/organization.model";

const alice: User = { id: "user-alice", email: "alice@example.com" };
const bob: User = { id: "user-bob", email: "bob@example.com" };

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
};

/**
 * Wire up all the context this service needs for a test:
 *   - Projects       (in-memory)
 *   - Organizations  (in-memory)  — Projects depends on it
 *   - CurrentUser    (per-test)   — who is making the call
 */
const run = <A, E>(
  effect: Effect.Effect<A, E, Projects | Organizations | CurrentUser>,
  options?: {
    projects?: readonly Project[];
    organizations?: readonly Organization[];
    user?: User;
  },
) =>
  Effect.runPromise(
    effect.pipe(
      Effect.either,
      Effect.provide(
        Layer.mergeAll(
          ProjectsMemory({ seed: options?.projects ?? [] }),
          OrganizationsMemory({ seed: options?.organizations ?? [] }),
          Layer.succeed(CurrentUser, options?.user ?? alice),
        ),
      ),
    ),
  );

describe("Projects.create", () => {
  it("fails when the target organization does not exist", async () => {
    const result = await run(
      Projects.create({
        name: "Alpha",
        organizationId: "nonexistent" as OrganizationId,
      }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect((result.left as { _tag: string })._tag).toBe(
        "OrganizationNotFound",
      );
    }
  });

  it("creates a project when the organization exists", async () => {
    const result = await run(
      Projects.create({ name: "Alpha", organizationId: orgA.id }),
      { organizations: [orgA] },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.name).toBe("Alpha");
      expect(result.right.organizationId).toBe(orgA.id);
    }
  });

  it("stamps the current user as the owner — identity comes from context", async () => {
    // Same service call, different identity provided via Layer.succeed.
    // This is Effect DI: Projects.create doesn't take a userId parameter;
    // it reads `CurrentUser` from context, and tests swap the identity
    // layer to prove the wiring.
    const asAlice = await run(
      Projects.create({ name: "Alpha", organizationId: orgA.id }),
      { organizations: [orgA], user: alice },
    );
    const asBob = await run(
      Projects.create({ name: "Beta", organizationId: orgA.id }),
      { organizations: [orgA], user: bob },
    );

    expect(Either.isRight(asAlice) && asAlice.right.ownerId).toBe(alice.id);
    expect(Either.isRight(asBob) && asBob.right.ownerId).toBe(bob.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// list / mine — the payoff of the per-feature repository
// ─────────────────────────────────────────────────────────────────────────────

const orgB: Organization = {
  id: "org-b" as OrganizationId,
  name: "Globex",
};

const aliceInA: Project = {
  id: "p-1" as ProjectId,
  name: "Alice at A",
  organizationId: orgA.id,
  ownerId: alice.id as UserId,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const aliceInB: Project = {
  id: "p-2" as ProjectId,
  name: "Alice at B",
  organizationId: orgB.id,
  ownerId: alice.id as UserId,
  createdAt: "2026-01-02T00:00:00.000Z",
};
const bobInA: Project = {
  id: "p-3" as ProjectId,
  name: "Bob at A",
  organizationId: orgA.id,
  ownerId: bob.id as UserId,
  createdAt: "2026-01-03T00:00:00.000Z",
};

const seed = [aliceInA, aliceInB, bobInA];

describe("Projects.list", () => {
  it("returns everything with no filter", async () => {
    const result = await run(Projects.list(), { projects: seed });
    expect(Either.isRight(result) && result.right.length).toBe(3);
  });

  it("filters by ownerId", async () => {
    const result = await run(
      Projects.list({ ownerId: alice.id as UserId }),
      { projects: seed },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        aliceInB.id,
      ]);
    }
  });

  it("filters by organizationId", async () => {
    const result = await run(
      Projects.list({ organizationId: orgA.id }),
      { projects: seed },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        bobInA.id,
      ]);
    }
  });

  it("intersects filters (ownerId AND organizationId)", async () => {
    const result = await run(
      Projects.list({
        ownerId: alice.id as UserId,
        organizationId: orgA.id,
      }),
      { projects: seed },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.map((p) => p.id)).toEqual([aliceInA.id]);
    }
  });
});

describe("Projects.mine", () => {
  it("returns only the requesting user's projects — identity from context", async () => {
    const asAlice = await run(Projects.mine(), {
      projects: seed,
      user: alice,
    });
    const asBob = await run(Projects.mine(), {
      projects: seed,
      user: bob,
    });

    expect(Either.isRight(asAlice)).toBe(true);
    if (Either.isRight(asAlice)) {
      expect(asAlice.right.map((p) => p.id).sort()).toEqual([
        aliceInA.id,
        aliceInB.id,
      ]);
    }
    expect(Either.isRight(asBob)).toBe(true);
    if (Either.isRight(asBob)) {
      expect(asBob.right.map((p) => p.id)).toEqual([bobInA.id]);
    }
  });
});
