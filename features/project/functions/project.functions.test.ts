import { describe, it, expect } from "vitest"
import { Effect, Schema } from "effect"
import { createProjectFunctions } from "./project.functions"
import { createProjectDependenciesMock } from "./project.functions.mock"
import {
  ProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectNotFound,
  type Project,
  type ProjectId,
} from "../entity/project.schema"

const runWithMock = <A, E>(
  seed: Project[],
  fn: (fns: ReturnType<typeof createProjectFunctions>) => Effect.Effect<A, E>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const deps = yield* createProjectDependenciesMock(seed)
      const functions = createProjectFunctions(deps)
      return yield* fn(functions)
    }),
  )

const seedProject: Project = {
  id: "seed-id" as ProjectId,
  title: "Seed Project",
}

// --- Schema tests ---

describe("ProjectSchema", () => {
  const decode = <A, I>(schema: Schema.Schema<A, I>, input: unknown) =>
    Effect.runSync(Schema.decode(schema)(input as I))

  const decodeFail = <A, I>(schema: Schema.Schema<A, I>, input: unknown) =>
    expect(() => Effect.runSync(Schema.decode(schema)(input as I))).toThrow()

  it("decodes a valid project", () => {
    const result = decode(ProjectSchema, { id: "abc-123", title: "My Project" })
    expect(result).toEqual({ id: "abc-123", title: "My Project" })
  })

  it("rejects empty title", () => {
    decodeFail(ProjectSchema, { id: "abc", title: "" })
  })

  it("rejects missing fields", () => {
    decodeFail(ProjectSchema, { id: "abc" })
    decodeFail(ProjectSchema, { title: "Test" })
    decodeFail(ProjectSchema, {})
  })

  it("decodes CreateProjectSchema", () => {
    expect(decode(CreateProjectSchema, { title: "New" })).toEqual({
      title: "New",
    })
    decodeFail(CreateProjectSchema, { title: "" })
    decodeFail(CreateProjectSchema, {})
  })

  it("decodes UpdateProjectSchema", () => {
    expect(decode(UpdateProjectSchema, { title: "Up" })).toEqual({
      title: "Up",
    })
    expect(decode(UpdateProjectSchema, {})).toEqual({})
    decodeFail(UpdateProjectSchema, { title: "" })
  })
})

// --- Function tests ---

describe("ProjectFunctions", () => {
  describe("getAll", () => {
    it("returns empty array when no projects", async () => {
      const result = await runWithMock([], (fns) => fns.getAll())
      expect(result).toEqual([])
    })

    it("returns seeded projects", async () => {
      const result = await runWithMock([seedProject], (fns) => fns.getAll())
      expect(result).toEqual([seedProject])
    })
  })

  describe("getById", () => {
    it("returns project when found", async () => {
      const result = await runWithMock([seedProject], (fns) =>
        fns.getById(seedProject.id),
      )
      expect(result).toEqual(seedProject)
    })

    it("fails with ProjectNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.getById("nonexistent" as ProjectId).pipe(
          Effect.catchTag("ProjectNotFound", (e) =>
            Effect.succeed({ _tag: "ProjectNotFound" as const, id: e.id }),
          ),
        ),
      )
      expect(result).toEqual({ _tag: "ProjectNotFound", id: "nonexistent" })
    })
  })

  describe("create", () => {
    it("creates a project and persists it", async () => {
      const result = await runWithMock([], (fns) =>
        Effect.gen(function* () {
          const created = yield* fns.create({ title: "New Project" })
          expect(created.title).toBe("New Project")
          expect(created.id).toBeDefined()

          return yield* fns.getAll()
        }),
      )
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe("New Project")
    })
  })

  describe("update", () => {
    it("updates an existing project", async () => {
      const result = await runWithMock([seedProject], (fns) =>
        fns.update(seedProject.id, { title: "Updated Title" }),
      )
      expect(result.title).toBe("Updated Title")
      expect(result.id).toBe(seedProject.id)
    })

    it("keeps existing title when not provided", async () => {
      const result = await runWithMock([seedProject], (fns) =>
        fns.update(seedProject.id, {}),
      )
      expect(result.title).toBe(seedProject.title)
    })

    it("fails with ProjectNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.update("nonexistent" as ProjectId, { title: "Nope" }).pipe(
          Effect.catchTag("ProjectNotFound", (e) =>
            Effect.succeed({ _tag: "ProjectNotFound" as const, id: e.id }),
          ),
        ),
      )
      expect(result).toEqual({ _tag: "ProjectNotFound", id: "nonexistent" })
    })
  })

  describe("remove", () => {
    it("removes an existing project", async () => {
      const result = await runWithMock([seedProject], (fns) =>
        Effect.gen(function* () {
          yield* fns.remove(seedProject.id)
          return yield* fns.getAll()
        }),
      )
      expect(result).toEqual([])
    })

    it("fails with ProjectNotFound when not found", async () => {
      const result = await runWithMock([], (fns) =>
        fns.remove("nonexistent" as ProjectId).pipe(
          Effect.catchTag("ProjectNotFound", (e) =>
            Effect.succeed({ _tag: "ProjectNotFound" as const, id: e.id }),
          ),
        ),
      )
      expect(result).toEqual({ _tag: "ProjectNotFound", id: "nonexistent" })
    })
  })
})
