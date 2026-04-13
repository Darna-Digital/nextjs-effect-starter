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
    <main className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-12">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <h1 className="text-base/7 font-semibold text-gray-900 dark:text-white">
            Organizations
          </h1>
          <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
            Manage your organizations.
          </p>
        </div>

        <section>
          <h2 className="text-sm/6 font-medium text-gray-900 dark:text-white">
            New organization
          </h2>
          <div className="mt-4">
            <OrganizationForm
              onSubmit={(data) => createMutation.mutate(data)}
              isPending={createMutation.isPending}
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm/6 font-medium text-gray-900 dark:text-white">
            All organizations
          </h2>
          <div className="mt-4">
            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </p>
              </div>
            ) : (
              <OrganizationList
                organizations={organizations}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
