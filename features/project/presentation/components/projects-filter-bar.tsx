"use client";

import type { Organization } from "@/lib/api/types";

export type ProjectsFilterState = {
  onlyMine: boolean;
  organizationId: string | null;
};

export const emptyProjectsFilter: ProjectsFilterState = {
  onlyMine: false,
  organizationId: null,
};

type Props = {
  value: ProjectsFilterState;
  onChange: (next: ProjectsFilterState) => void;
  organizations: readonly Organization[];
  currentUserId: string | null;
};

export function ProjectsFilterBar({
  value,
  onChange,
  organizations,
  currentUserId,
}: Props) {
  const active = value.onlyMine || value.organizationId !== null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <label className="flex items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Organization
        </span>

        <select
          value={value.organizationId ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              organizationId: e.target.value || null,
            })
          }
          className="rounded-md bg-white px-2 py-1 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
        >
          <option value="">All</option>

          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </label>

      <label
        className={`flex items-center gap-x-2 text-sm ${
          currentUserId
            ? "text-gray-600 dark:text-gray-300"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <input
          type="checkbox"
          checked={value.onlyMine}
          onChange={(e) => onChange({ ...value, onlyMine: e.target.checked })}
          disabled={!currentUserId}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/20 dark:bg-white/5"
        />
        Only mine
      </label>

      {active && (
        <button
          type="button"
          onClick={() => onChange(emptyProjectsFilter)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/**
 * Translate the UI state into the query shape `useProjects` expects.
 * Keeping this close to the component so the page layer stays dumb.
 */
export function toProjectsQuery(
  state: ProjectsFilterState,
  currentUserId: string | null,
) {
  return {
    ownerId: state.onlyMine && currentUserId ? currentUserId : undefined,
    organizationId: state.organizationId ?? undefined,
  };
}
