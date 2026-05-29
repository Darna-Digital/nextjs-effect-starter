import { describe, it, expect } from "vitest";
import { Effect, Result } from "effect";
import { Organizations } from "@/features/organization/service/organization.service";
import { OrganizationsMemory } from "@/features/organization/layer/organization.layer.memory";
import type {
  CreateOrganization,
  UpdateOrganization,
} from "@/features/organization/schema/organization.schema.requests";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model";

// v4 services expose no static accessors; access via the service instance.
const create = (input: CreateOrganization) =>
  Effect.flatMap(Organizations, (s) => s.create(input));
const update = (id: OrganizationId, input: UpdateOrganization) =>
  Effect.flatMap(Organizations, (s) => s.update(id, input));

function run<Success, Failure>(
  effect: Effect.Effect<Success, Failure, Organizations>,
  options?: {
    seed?: readonly Organization[];
    reserved?: readonly string[];
  },
) {
  return Effect.runPromise(
    effect.pipe(Effect.result, Effect.provide(OrganizationsMemory(options))),
  );
}

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
  description: "first",
};

describe("Organizations.create", () => {
  it("rejects a reserved name", async () => {
    const result = await run(create({ name: "Admin" }), {
      reserved: ["admin"],
    });
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result))
      expect(result.failure._tag).toBe("OrganizationNameReserved");
  });

  it("rejects a duplicate name regardless of case", async () => {
    const result = await run(create({ name: "acme" }), {
      seed: [orgA],
    });
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result))
      expect(result.failure._tag).toBe("OrganizationNameTaken");
  });

  it("allows a fresh unique name", async () => {
    const result = await run(create({ name: "Globex" }), {
      seed: [orgA],
    });
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) expect(result.success.name).toBe("Globex");
  });
});

describe("Organizations.update", () => {
  it("rejects renaming to a reserved name", async () => {
    const result = await run(update(orgA.id, { name: "System" }), {
      seed: [orgA],
      reserved: ["system"],
    });
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result))
      expect(result.failure._tag).toBe("OrganizationNameReserved");
  });

  it("rejects renaming to a name owned by another org", async () => {
    const orgB: Organization = {
      id: "org-b" as OrganizationId,
      name: "Globex",
    };
    const result = await run(update(orgB.id, { name: "acme" }), {
      seed: [orgA, orgB],
    });
    expect(Result.isFailure(result)).toBe(true);
    if (Result.isFailure(result))
      expect(result.failure._tag).toBe("OrganizationNameTaken");
  });

  it("allows an org to keep its own name (self-match is not a conflict)", async () => {
    const result = await run(
      update(orgA.id, {
        name: "Acme",
        description: "renamed desc",
      }),
      { seed: [orgA] },
    );
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.name).toBe("Acme");
      expect(result.success.description).toBe("renamed desc");
    }
  });

  it("allows updates that don't touch the name", async () => {
    const result = await run(update(orgA.id, { description: "updated" }), {
      seed: [orgA],
    });
    expect(Result.isSuccess(result)).toBe(true);
    if (Result.isSuccess(result)) {
      expect(result.success.name).toBe(orgA.name);
      expect(result.success.description).toBe("updated");
    }
  });
});
