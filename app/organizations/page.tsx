"use client"

import { OrganizationForm } from "@/features/organization/presentation/components/organization-form"
import { OrganizationList } from "@/features/organization/presentation/components/organization-list"
import {
  useOrganizations,
  useCreateOrganization,
  useDeleteOrganization,
} from "@/features/organization/presentation/hooks/use-organizations"

export default function OrganizationsPage() {
  const { data: organizations = [], isLoading } = useOrganizations()
  const createMutation = useCreateOrganization()
  const deleteMutation = useDeleteOrganization()

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-2xl font-bold">Organizations</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Create Organization</h2>
        <OrganizationForm
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">All Organizations</h2>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <OrganizationList
            organizations={organizations}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </section>
    </main>
  )
}
