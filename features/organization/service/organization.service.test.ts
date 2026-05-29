import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { Organizations } from "@/features/organization/service/organization.service";
import { OrganizationsMemory } from "@/features/organization/layer/organization.layer.memory";
import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model";

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
  description: "first",
};
const orgB: Organization = {
  id: "org-b" as OrganizationId,
  name: "Globex",
};

describe("Organizations.create", () => {
  it.effect("rejects a reserved name", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const error = yield* Effect.flip(orgs.create({ name: "Admin" }));
      expect(error._tag).toBe("OrganizationNameReserved");
    }).pipe(Effect.provide(OrganizationsMemory({ reserved: ["admin"] }))),
  );

  it.effect("rejects a duplicate name regardless of case", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const error = yield* Effect.flip(orgs.create({ name: "acme" }));
      expect(error._tag).toBe("OrganizationNameTaken");
    }).pipe(Effect.provide(OrganizationsMemory({ seed: [orgA] }))),
  );

  it.effect("allows a fresh unique name", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const created = yield* orgs.create({ name: "Globex" });
      expect(created.name).toBe("Globex");
    }).pipe(Effect.provide(OrganizationsMemory({ seed: [orgA] }))),
  );
});

describe("Organizations.update", () => {
  it.effect("rejects renaming to a reserved name", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const error = yield* Effect.flip(orgs.update(orgA.id, { name: "System" }));
      expect(error._tag).toBe("OrganizationNameReserved");
    }).pipe(
      Effect.provide(OrganizationsMemory({ seed: [orgA], reserved: ["system"] })),
    ),
  );

  it.effect("rejects renaming to a name owned by another org", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const error = yield* Effect.flip(orgs.update(orgB.id, { name: "acme" }));
      expect(error._tag).toBe("OrganizationNameTaken");
    }).pipe(Effect.provide(OrganizationsMemory({ seed: [orgA, orgB] }))),
  );

  it.effect("allows an org to keep its own name (self-match is not a conflict)", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const updated = yield* orgs.update(orgA.id, {
        name: "Acme",
        description: "renamed desc",
      });
      expect(updated.name).toBe("Acme");
      expect(updated.description).toBe("renamed desc");
    }).pipe(Effect.provide(OrganizationsMemory({ seed: [orgA] }))),
  );

  it.effect("allows updates that don't touch the name", () =>
    Effect.gen(function* () {
      const orgs = yield* Organizations;
      const updated = yield* orgs.update(orgA.id, { description: "updated" });
      expect(updated.name).toBe(orgA.name);
      expect(updated.description).toBe("updated");
    }).pipe(Effect.provide(OrganizationsMemory({ seed: [orgA] }))),
  );
});
