import { describe, it, expect } from "vitest"
import { Effect, Either } from "effect"
import { createOrganizationFunctions } from "./organization.functions"
import { createOrganizationDependenciesMock } from "./organization.functions.mock"
import {
  type Organization,
  type OrganizationId,
} from "../entity/organization.schema"

/**
 * These tests exercise business rules in the functions layer:
 *   1. reserved-name rejection
 *   2. case-insensitive uniqueness (create + update)
 *   3. update allows an org to keep its own name
 *
 * They do not re-test Effect, the schema, or the persistence layer.
 */

type Fns = ReturnType<typeof createOrganizationFunctions>

/** Build functions with a fresh in-memory store and optional reserved list. */
const makeFns = (
  seed: Organization[] = [],
  reserved: ReadonlySet<string> = new Set(),
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const deps = yield* createOrganizationDependenciesMock(seed, reserved)
      return createOrganizationFunctions(deps)
    }),
  )

/** Run an effect and return its result as Either, so we can assert on failures. */
const runEither = <A, E>(eff: Effect.Effect<A, E>) =>
  Effect.runPromise(Effect.either(eff))

const orgA: Organization = {
  id: "org-a" as OrganizationId,
  name: "Acme",
  description: "first",
}

describe("create", () => {
  it("rejects a reserved name", async () => {
    const fns = await makeFns([], new Set(["admin"]))

    const result = await runEither(fns.create({ name: "Admin" }))

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("OrganizationNameReserved")
    }
  })

  it("rejects a duplicate name regardless of case", async () => {
    const fns = await makeFns([orgA])

    const result = await runEither(fns.create({ name: "acme" }))

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("OrganizationNameTaken")
    }
  })

  it("allows a fresh unique name", async () => {
    const fns = await makeFns([orgA])

    const created = await Effect.runPromise(fns.create({ name: "Globex" }))

    expect(created.name).toBe("Globex")
  })
})

describe("update", () => {
  it("rejects renaming to a reserved name", async () => {
    const fns = await makeFns([orgA], new Set(["system"]))

    const result = await runEither(fns.update(orgA.id, { name: "System" }))

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("OrganizationNameReserved")
    }
  })

  it("rejects renaming to a name owned by another org", async () => {
    const orgB: Organization = {
      id: "org-b" as OrganizationId,
      name: "Globex",
    }
    const fns = await makeFns([orgA, orgB])

    const result = await runEither(fns.update(orgB.id, { name: "acme" }))

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("OrganizationNameTaken")
    }
  })

  it("allows an org to keep its own name (self-match is not a conflict)", async () => {
    const fns = await makeFns([orgA])

    const updated = await Effect.runPromise(
      fns.update(orgA.id, { name: "Acme", description: "renamed desc" }),
    )

    expect(updated.name).toBe("Acme")
    expect(updated.description).toBe("renamed desc")
  })

  it("allows updates that don't touch the name", async () => {
    const fns = await makeFns([orgA])

    const updated = await Effect.runPromise(
      fns.update(orgA.id, { description: "updated" }),
    )

    expect(updated.name).toBe(orgA.name)
    expect(updated.description).toBe("updated")
  })
})
