import { describe, it, expect } from "vitest"
import { Effect, Schema } from "effect"
import { createOrganizationFunctions } from "./organization.functions"
import { createOrganizationDependenciesMock } from "./organization.functions.mock"
import {
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  type Organization,
  type OrganizationId,
} from "../entity/organization.schema"

const runWithMock = <A, E>(
  seed: Organization[],
  fn: (
    fns: ReturnType<typeof createOrganizationFunctions>,
  ) => Effect.Effect<A, E>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const deps = yield* createOrganizationDependenciesMock(seed)
      const functions = createOrganizationFunctions(deps)
      return yield* fn(functions)
    }),
  )

const seedOrg: Organization = {
  id: "seed-id" as OrganizationId,
  name: "Seed Org",
  description: "A test organization",
}

// --- Schema tests ---

describe("OrganizationSchema", () => {
  const decode = <A, I>(schema: Schema.Schema<A, I>, input: unknown) =>
    Effect.runSync(Schema.decode(schema)(input as I))

  const decodeFail = <A, I>(schema: Schema.Schema<A, I>, input: unknown) =>
    expect(() => Effect.runSync(Schema.decode(schema)(input as I))).toThrow()

  it("decodes a valid organization", () => {
    const result = decode(OrganizationSchema, {
      id: "abc-123",
      name: "My Org",
      description: "desc",
    })
    expect(result).toEqual({ id: "abc-123", name: "My Org", description: "desc" })
  })

  it("rejects empty name", () => {
    decodeFail(OrganizationSchema, { id: "abc", name: "" })
  })

  it("rejects missing fields", () => {
    decodeFail(OrganizationSchema, { id: "abc" })
    decodeFail(OrganizationSchema, { name: "Test" })
    decodeFail(OrganizationSchema, {})
  })

  it("decodes CreateOrganizationSchema", () => {
    expect(decode(CreateOrganizationSchema, { name: "New" })).toEqual({
      name: "New",
    })
    decodeFail(CreateOrganizationSchema, { name: "" })
    decodeFail(CreateOrganizationSchema, {})
  })

  it("decodes UpdateOrganizationSchema", () => {
    expect(decode(UpdateOrganizationSchema, { name: "Up" })).toEqual({
      name: "Up",
    })
    expect(decode(UpdateOrganizationSchema, {})).toEqual({})
    decodeFail(UpdateOrganizationSchema, { name: "" })
  })
})

// --- Function tests ---

describe("OrganizationFunctions", () => {
  describe("getAll", () => {
    it("returns empty array when no organizations", async () => {
      const result = await runWithMock([], (fns) => fns.getAll())
      expect(result).toEqual([])
    })

    it("returns seeded organizations", async () => {
      const result = await runWithMock([seedOrg], (fns) => fns.getAll())
      expect(result).toEqual([seedOrg])
    })
  })

  describe("getById", () => {
    it("returns organization when found", async () => {
      const result = await runWithMock([seedOrg], (fns) =>
        fns.getById(seedOrg.id),
      )
      expect(result).toEqual(seedOrg)
    })

    it("fails with OrganizationNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.getById("nonexistent" as OrganizationId).pipe(
          Effect.catchTag("OrganizationNotFound", (e) =>
            Effect.succeed({
              _tag: "OrganizationNotFound" as const,
              id: e.id,
            }),
          ),
        ),
      )
      expect(result).toEqual({
        _tag: "OrganizationNotFound",
        id: "nonexistent",
      })
    })
  })

  describe("create", () => {
    it("creates an organization and persists it", async () => {
      const result = await runWithMock([], (fns) =>
        Effect.gen(function* () {
          const created = yield* fns.create({ name: "New Org" })
          expect(created.name).toBe("New Org")
          expect(created.id).toBeDefined()

          return yield* fns.getAll()
        }),
      )
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("New Org")
    })

    it("creates with optional description", async () => {
      const result = await runWithMock([], (fns) =>
        fns.create({ name: "Org", description: "A description" }),
      )
      expect(result.name).toBe("Org")
      expect(result.description).toBe("A description")
    })
  })

  describe("update", () => {
    it("updates an existing organization", async () => {
      const result = await runWithMock([seedOrg], (fns) =>
        fns.update(seedOrg.id, { name: "Updated Name" }),
      )
      expect(result.name).toBe("Updated Name")
      expect(result.id).toBe(seedOrg.id)
    })

    it("keeps existing fields when not provided", async () => {
      const result = await runWithMock([seedOrg], (fns) =>
        fns.update(seedOrg.id, {}),
      )
      expect(result.name).toBe(seedOrg.name)
      expect(result.description).toBe(seedOrg.description)
    })

    it("fails with OrganizationNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.update("nonexistent" as OrganizationId, { name: "Nope" }).pipe(
          Effect.catchTag("OrganizationNotFound", (e) =>
            Effect.succeed({
              _tag: "OrganizationNotFound" as const,
              id: e.id,
            }),
          ),
        ),
      )
      expect(result).toEqual({
        _tag: "OrganizationNotFound",
        id: "nonexistent",
      })
    })
  })

  describe("remove", () => {
    it("removes an existing organization", async () => {
      const result = await runWithMock([seedOrg], (fns) =>
        Effect.gen(function* () {
          yield* fns.remove(seedOrg.id)
          return yield* fns.getAll()
        }),
      )
      expect(result).toEqual([])
    })

    it("fails with OrganizationNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.remove("nonexistent" as OrganizationId).pipe(
          Effect.catchTag("OrganizationNotFound", (e) =>
            Effect.succeed({
              _tag: "OrganizationNotFound" as const,
              id: e.id,
            }),
          ),
        ),
      )
      expect(result).toEqual({
        _tag: "OrganizationNotFound",
        id: "nonexistent",
      })
    })
  })
})
