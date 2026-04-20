import { Effect, Ref } from "effect"
import { ProjectNotFound, type Project } from "./project.model"
import type { ProjectRepo } from "./project.repository"

/**
 * In-memory `ProjectRepository` — a `Ref<Project[]>` + `Array.filter`. One
 * place per feature to write this; takes less code than the generic
 * `Storage<T>` ever did.
 */
export const createMemoryProjectRepository = (
  seed: readonly Project[] = [],
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Project[]>([...seed])

    const repo: ProjectRepo = {
      list: (filter = {}) =>
        Ref.get(store).pipe(
          Effect.map((items) =>
            items.filter(
              (p) =>
                (!filter.ownerId || p.ownerId === filter.ownerId) &&
                (!filter.organizationId ||
                  p.organizationId === filter.organizationId),
            ),
          ),
        ),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const found = items.find((p) => p.id === id)
            return found
              ? Effect.succeed(found)
              : Effect.fail(new ProjectNotFound({ id }))
          }),
        ),

      create: (project) =>
        Ref.update(store, (items) => [...items, project]).pipe(
          Effect.as(project),
        ),

      update: (id, patch) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const index = items.findIndex((p) => p.id === id)
            if (index === -1)
              return Effect.fail(new ProjectNotFound({ id }))
            const updated = { ...items[index], ...patch } as Project
            return Ref.update(store, (current) => {
              const next = [...current]
              next[index] = updated
              return next
            }).pipe(Effect.as(updated))
          }),
        ),

      remove: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            if (!items.some((p) => p.id === id))
              return Effect.fail(new ProjectNotFound({ id }))
            return Ref.update(store, (current) =>
              current.filter((p) => p.id !== id),
            )
          }),
        ),
    }

    return repo
  })
