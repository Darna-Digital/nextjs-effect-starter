import { describe, it, expect } from "vitest";
import { Effect, Either } from "effect";
import { Organizations } from "@/features/organization/service/organization.service";
import { OrganizationsMemory } from "@/features/organization/layer/organization.layer.memory";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model";

const run = <A, E>(
  effect: Effect.Effect<A, E, Organizations>,
  options?: {
    seed?: readonly Organization[];
    reserved?: readonly string[];
  },
) =>
  Effect.runPromise(
    effect.pipe(Effect.either, Effect.provide(OrganizationsMemory(options))),
  );

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
  description: "first",
};

describe("Organizations.create", () => {
  it("rejects a reserved name", async () => {
    const result = await run(Organizations.create({ name: "Admin" }), {
      reserved: ["admin"],
    });
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("OrganizationNameReserved");
  });

  it("rejects a duplicate name regardless of case", async () => {
    const result = await run(Organizations.create({ name: "acme" }), {
      seed: [orgA],
    });
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("OrganizationNameTaken");
  });

  it("allows a fresh unique name", async () => {
    const result = await run(Organizations.create({ name: "Globex" }), {
      seed: [orgA],
    });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.name).toBe("Globex");
  });
});

describe("Organizations.update", () => {
  it("rejects renaming to a reserved name", async () => {
    const result = await run(
      Organizations.update(orgA.id, { name: "System" }),
      { seed: [orgA], reserved: ["system"] },
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("OrganizationNameReserved");
  });

  it("rejects renaming to a name owned by another org", async () => {
    const orgB: Organization = {
      id: "org-b" as OrganizationId,
      name: "Globex",
    };
    const result = await run(Organizations.update(orgB.id, { name: "acme" }), {
      seed: [orgA, orgB],
    });
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("OrganizationNameTaken");
  });

  it("allows an org to keep its own name (self-match is not a conflict)", async () => {
    const result = await run(
      Organizations.update(orgA.id, {
        name: "Acme",
        description: "renamed desc",
      }),
      { seed: [orgA] },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.name).toBe("Acme");
      expect(result.right.description).toBe("renamed desc");
    }
  });

  it("allows updates that don't touch the name", async () => {
    const result = await run(
      Organizations.update(orgA.id, { description: "updated" }),
      { seed: [orgA] },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.name).toBe(orgA.name);
      expect(result.right.description).toBe("updated");
    }
  });
});
