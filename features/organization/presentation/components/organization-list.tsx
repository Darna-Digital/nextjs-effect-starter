"use client"

import type {
  Organization,
  OrganizationId,
} from "@/features/organization/schema/organization.schema.model"

interface OrganizationListProps {
  organizations: readonly Organization[]
  onDelete?: (id: OrganizationId) => void
}

export function OrganizationList({
  organizations,
  onDelete,
}: OrganizationListProps) {
  if (organizations.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No organizations yet.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/10">
      {organizations.map((org) => (
        <li key={org.id} className="flex items-center justify-between gap-x-6 py-4">
          <div className="min-w-0">
            <p className="text-sm/6 font-semibold text-gray-900 dark:text-white">
              {org.name}
            </p>
            {org.description && (
              <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">
                {org.description}
              </p>
            )}
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(org.id)}
              className="rounded-md px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-600/20 hover:bg-red-50 dark:text-red-400 dark:ring-red-400/20 dark:hover:bg-red-400/10"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
