import type {
  ProjectDependencies,
  ProjectFunctions,
} from "../entity/project.interfaces"

export function createProjectFunctions(
  d: ProjectDependencies,
): ProjectFunctions {
  return {
    getAll: () => d.sideEffects.getAll(),
    getById: (id) => d.sideEffects.getById(id),
    create: (input) => d.sideEffects.create(input),
    update: (id, input) => d.sideEffects.update(id, input),
    remove: (id) => d.sideEffects.remove(id),
  }
}
