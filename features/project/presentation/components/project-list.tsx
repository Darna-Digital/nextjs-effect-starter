"use client";

import { Trash2 } from "lucide-react";
import type { Organization, Project } from "@/lib/api/types";
import { useCurrentUser } from "@/features/auth/presentation/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  projects: readonly Project[];
  organizations: readonly Organization[];
  onDelete?: (id: Project["id"]) => void;
};

export function ProjectList({ projects, organizations, onDelete }: Props) {
  const { data: currentUser } = useCurrentUser();

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No projects yet.
      </div>
    );
  }

  function orgName(id: string) {
    return organizations.find((o) => o.id === id)?.name ?? id;
  }

  return (
    <Card className="py-0">
      <ul className="divide-y divide-border">
        {projects.map((p) => {
          const mine = currentUser?.id === p.ownerId;

          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {mine && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Yours
                    </span>
                  )}
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {orgName(p.organizationId)}
                </p>

                {p.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.description}
                  </p>
                )}
              </div>

              {onDelete && mine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => onDelete(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
