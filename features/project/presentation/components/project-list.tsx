"use client"

import type { Project, ProjectId } from "@/features/project/schema/project.schema.model"
import type { Organization } from "@/features/organization/schema/organization.schema.model"
import { useCurrentUser } from "@/features/auth/presentation/hooks/use-auth"

type Props = {
  projects: readonly Project[]
  /** Used to resolve `organizationId` → display name. */
  organizations: readonly Organization[]
  onDelete?: (id: ProjectId) => void
}

export function ProjectList({
  projects,
  organizations,
  onDelete,
}: Props) {
  const { data: currentUser } = useCurrentUser()

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No projects yet.
        </p>
      </div>
    )
  }

  function orgName(id: string) {
    return organizations.find((o) => o.id === id)?.name ?? id
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/10">
      {projects.map((p) => {
        const mine = currentUser?.id === p.ownerId
        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-x-6 py-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-x-2">
                <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                  {p.name}
                </p>
                {mine && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.625rem] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
                    Yours
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {orgName(p.organizationId)} · owner {p.ownerId}
              </p>
              {p.description && (
                <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                  {p.description}
                </p>
              )}
            </div>
            {onDelete && mine && (
              <button
                onClick={() => onDelete(p.id)}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-600/20 hover:bg-red-50 dark:text-red-400 dark:ring-red-400/20 dark:hover:bg-red-400/10"
              >
                Delete
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
