import { describe, it, expect } from "vitest";
import { Effect, Either, Layer } from "effect";
import { Projects } from "./project.service";
import { ProjectsMemory } from "./project.layers.memory";
import { OrganizationsMemory } from "@/features/organization/organization.layers.memory";
import { Organizations } from "@/features/organization/organization.service";
import { CurrentUser, type User } from "@/lib/effect/layers/auth";
import type { Project } from "./project.model";
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
