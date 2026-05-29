"use client";

import type { Organization } from "@/lib/api/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-wrap items-center gap-3">
      <Select
        aria-label="Filter by organization"
        value={value.organizationId ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            organizationId: e.target.value || null,
          })
        }
        containerClassName="w-44"
      >
        <option value="">All organizations</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </Select>

      <label
        className={`flex items-center gap-2 text-sm select-none ${
          currentUserId ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <input
          type="checkbox"
          checked={value.onlyMine}
          onChange={(e) => onChange({ ...value, onlyMine: e.target.checked })}
          disabled={!currentUserId}
          className="size-4 rounded border-input text-primary accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        Only mine
      </label>

      {active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(emptyProjectsFilter)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

export function toProjectsQuery(
  state: ProjectsFilterState,
  currentUserId: string | null,
) {
  return {
    ownerId: state.onlyMine && currentUserId ? currentUserId : undefined,
    organizationId: state.organizationId ?? undefined,
  };
}
