"use client"

import { useState } from "react"
import { ProjectForm } from "@/features/project/presentation/components/project-form"
import { ProjectList } from "@/features/project/presentation/components/project-list"
import {
  ProjectsFilterBar,
  emptyProjectsFilter,
  toProjectsQuery,
  type ProjectsFilterState,
} from "@/features/project/presentation/components/projects-filter-bar"
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  parseProjectError,
} from "@/features/project/presentation/hooks/use-projects"
import { useOrganizations } from "@/features/organization/presentation/hooks/use-organizations"
import { useCurrentUser } from "@/features/auth/presentation/hooks/use-current-user"

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectsFilterState>(emptyProjectsFilter)
  const { data: currentUser } = useCurrentUser()

  const query = toProjectsQuery(filter, currentUser?.id ?? null)

  const { data: projects = [], isLoading: loadingProjects } =
    useProjects(query)
  const { data: organizations = [], isLoading: loadingOrgs } =
    useOrganizations()
  const createMutation = useCreateProject()
  const deleteMutation = useDeleteProject()

  const loading = loadingProjects || loadingOrgs
  const heading = filter.onlyMine ? "Your projects" : "All projects"

  return (
    <main className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <h1 className="text-base/7 font-semibold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
            Manage projects across your organizations.
          </p>
        </div>

        <section>
          <h2 className="text-sm/6 font-medium text-gray-900 dark:text-white">
            New project
          </h2>
          <div className="mt-4">
            <ProjectForm
              organizations={organizations}
              onSubmit={(data) => createMutation.mutateAsync(data)}
              isPending={createMutation.isPending}
              submitError={parseProjectError(createMutation.error)}
            />
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-sm/6 font-medium text-gray-900 dark:text-white">
              {heading}
            </h2>
            <ProjectsFilterBar
              value={filter}
              onChange={setFilter}
              organizations={organizations}
              currentUserId={currentUser?.id ?? null}
            />
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </p>
              </div>
            ) : (
              <ProjectList
                projects={projects}
                organizations={organizations}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
