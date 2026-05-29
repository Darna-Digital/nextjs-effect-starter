"use client";

import { OrganizationForm } from "@/features/organization/presentation/components/organization-form";
import { OrganizationList } from "@/features/organization/presentation/components/organization-list";
import {
  useOrganizations,
  useCreateOrganization,
  useDeleteOrganization,
  parseOrganizationError,
} from "@/features/organization/presentation/hooks/use-organizations";
import { Card, CardContent } from "@/components/ui/card";

export default function OrganizationsPage() {
  const { data: organizations = [], isLoading } = useOrganizations();
  const createMutation = useCreateOrganization();
  const deleteMutation = useDeleteOrganization();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your organizations.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            New organization
          </h2>
          <Card>
            <CardContent>
              <OrganizationForm
                onSubmit={(data) => createMutation.mutateAsync(data)}
                isPending={createMutation.isPending}
                submitError={parseOrganizationError(createMutation.error)}
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            All organizations
          </h2>
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <OrganizationList
              organizations={organizations}
              onDelete={deleteMutation.mutate}
            />
          )}
        </section>
      </div>
    </main>
  );
}
