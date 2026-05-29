"use client";

import { Trash2 } from "lucide-react";
import type { Organization } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  organizations: readonly Organization[];
  onDelete?: (id: Organization["id"]) => void;
};

export function OrganizationList({ organizations, onDelete }: Props) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No organizations yet.
      </div>
    );
  }

  return (
    <Card className="py-0">
      <ul className="divide-y divide-border">
        {organizations.map((org) => (
          <li
            key={org.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{org.name}</p>
              {org.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {org.description}
                </p>
              )}
            </div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${org.name}`}
                onClick={() => onDelete(org.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
