import { Effect } from "effect"
import * as fs from "node:fs/promises"
import type { ProjectDependencies } from "../entity/project.interfaces"
import { ProjectNotFound } from "../entity/project.schema"
import { StorageError } from "@/lib/errors"
import { TracingLayer } from "@/lib/tracing"
import { createProjectFunctions } from "../functions/project.functions"
import type {
  Project,
  ProjectId,
  CreateProject,
  UpdateProject,
} from "../entity/project.schema"
import type { ParseError } from "effect/ParseResult"

const DATA_PATH = "./data/projects.json"

const readProjects = Effect.tryPromise({
  try: async () => {
    try {
      const raw = await fs.readFile(DATA_PATH, "utf-8")
      return JSON.parse(raw) as Project[]
    } catch {
      return [] as Project[]
    }
  },
  catch: (cause) => new StorageError({ cause }),
})

const writeProjects = (projects: Project[]) =>
  Effect.tryPromise({
    try: async () => {
      await fs.mkdir("./data", { recursive: true })
      await fs.writeFile(DATA_PATH, JSON.stringify(projects, null, 2))
    },
    catch: (cause) => new StorageError({ cause }),
  })

const dependencies: ProjectDependencies = {
  data: {},
  sideEffects: {
    getAll: () => readProjects,

    getById: (id: ProjectId) =>
      Effect.gen(function* () {
        const projects = yield* readProjects
        const project = projects.find((p) => p.id === id)
        if (!project) return yield* new ProjectNotFound({ id })
        return project
      }),

    create: (input: CreateProject) =>
      Effect.gen(function* () {
        const projects = yield* readProjects
        const project: Project = {
          id: crypto.randomUUID() as ProjectId,
          title: input.title,
        }
        yield* writeProjects([...projects, project])
        return project
      }),

    update: (id: ProjectId, input: UpdateProject) =>
      Effect.gen(function* () {
        const projects = yield* readProjects
        const index = projects.findIndex((p) => p.id === id)
        if (index === -1) return yield* new ProjectNotFound({ id })
        const existing = projects[index]
        const updated: Project = {
          id: existing.id,
          title: input.title ?? existing.title,
        }
        const next = [...projects]
        next[index] = updated
        yield* writeProjects(next)
        return updated
      }),

    remove: (id: ProjectId) =>
      Effect.gen(function* () {
        const projects = yield* readProjects
        const filtered = projects.filter((p) => p.id !== id)
        if (filtered.length === projects.length)
          return yield* new ProjectNotFound({ id })
        yield* writeProjects(filtered)
      }),
  },
}

const projectFunctions = createProjectFunctions(dependencies)

export { projectFunctions }

type ProjectError = StorageError | ProjectNotFound | ParseError

export const provideAndRun = <A>(
  effect: Effect.Effect<A, ProjectError>,
): Promise<A | Response> =>
  effect.pipe(
    Effect.catchTags({
      ProjectNotFound: (e) =>
        Effect.succeed(
          Response.json({ error: "Not found", id: e.id }, { status: 404 }),
        ),
      StorageError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Storage error", cause: String(e.cause) },
            { status: 500 },
          ),
        ),
      ParseError: (e) =>
        Effect.succeed(
          Response.json(
            { error: "Validation failed", details: e.message },
            { status: 400 },
          ),
        ),
    }),
    Effect.provide(TracingLayer),
    Effect.runPromise,
  )
