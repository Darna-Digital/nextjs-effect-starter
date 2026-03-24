import { Effect, Ref } from "effect"
import type { ProjectDependencies } from "../entity/project.interfaces"
import type {
  Project,
  ProjectId,
  CreateProject,
  UpdateProject,
} from "../entity/project.schema"
import { ProjectNotFound } from "../entity/project.schema"

export const createProjectDependenciesMock = (
  initial: Project[] = [],
): Effect.Effect<ProjectDependencies> =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Project[]>(initial)

    return {
      data: {},
      sideEffects: {
        getAll: () => Ref.get(store),

        getById: (id: ProjectId) =>
          Effect.gen(function* () {
            const projects = yield* Ref.get(store)
            const project = projects.find((p) => p.id === id)
            if (!project) return yield* new ProjectNotFound({ id })
            return project
          }),

        create: (input: CreateProject) =>
          Effect.gen(function* () {
            const project: Project = {
              id: crypto.randomUUID() as ProjectId,
              title: input.title,
            }
            yield* Ref.update(store, (ps) => [...ps, project])
            return project
          }),

        update: (id: ProjectId, input: UpdateProject) =>
          Effect.gen(function* () {
            const projects = yield* Ref.get(store)
            const index = projects.findIndex((p) => p.id === id)
            if (index === -1) return yield* new ProjectNotFound({ id })
            const existing = projects[index]
            const updated: Project = {
              id: existing.id,
              title: input.title ?? existing.title,
            }
            yield* Ref.update(store, (ps) => {
              const next = [...ps]
              next[index] = updated
              return next
            })
            return updated
          }),

        remove: (id: ProjectId) =>
          Effect.gen(function* () {
            const projects = yield* Ref.get(store)
            const filtered = projects.filter((p) => p.id !== id)
            if (filtered.length === projects.length)
              return yield* new ProjectNotFound({ id })
            yield* Ref.set(store, filtered)
          }),
      },
    }
  })
