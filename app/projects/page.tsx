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
import { Card, CardContent } from "@/components/ui/card"

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
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage projects across your organizations.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            New project
          </h2>
          <Card>
            <CardContent>
              <ProjectForm
                organizations={organizations}
                onSubmit={(data) => createMutation.mutateAsync(data)}
                isPending={createMutation.isPending}
                submitError={parseProjectError(createMutation.error)}
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {heading}
            </h2>
            <ProjectsFilterBar
              value={filter}
              onChange={setFilter}
              organizations={organizations}
              currentUserId={currentUser?.id ?? null}
            />
          </div>
          {loading ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <ProjectList
              projects={projects}
              organizations={organizations}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          )}
        </section>
      </div>
    </main>
  )
}
