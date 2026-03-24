import { Effect } from "effect"
import type {
  ProjectDependencies,
  ProjectFunctions,
} from "../entity/project.interfaces"

export function createProjectFunctions(
  d: ProjectDependencies,
): ProjectFunctions {
  return {
    getAll: () =>
      d.sideEffects.getAll().pipe(Effect.withSpan("Project.getAll")),

    getById: (id) =>
      d.sideEffects
        .getById(id)
        .pipe(Effect.withSpan("Project.getById", { attributes: { id } })),

    create: (input) =>
      d.sideEffects
        .create(input)
        .pipe(
          Effect.withSpan("Project.create", {
            attributes: { title: input.title },
          }),
        ),

    update: (id, input) =>
      d.sideEffects
        .update(id, input)
        .pipe(Effect.withSpan("Project.update", { attributes: { id } })),

    remove: (id) =>
      d.sideEffects
        .remove(id)
        .pipe(Effect.withSpan("Project.remove", { attributes: { id } })),
  }
}
