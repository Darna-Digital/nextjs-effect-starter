"use client"

import type { Organization, OrganizationId } from "../../entity/organization.schema"

interface OrganizationListProps {
  organizations: Organization[]
  onDelete?: (id: OrganizationId) => void
}

export function OrganizationList({
  organizations,
  onDelete,
}: OrganizationListProps) {
  if (organizations.length === 0) {
    return <p className="text-gray-500">No organizations yet.</p>
  }

  return (
    <ul className="space-y-2">
      {organizations.map((org) => (
        <li
          key={org.id}
          className="flex items-center justify-between rounded border border-gray-200 px-4 py-3"
        >
          <div>
            <h3 className="font-medium">{org.name}</h3>
            {org.description && (
              <p className="text-sm text-gray-500">{org.description}</p>
            )}
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(org.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
