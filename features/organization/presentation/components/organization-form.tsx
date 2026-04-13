"use client"

import { useForm } from "react-hook-form"
import { effectSchemaResolver } from "@/lib/form/effect-schema-resolver"
import {
  CreateOrganizationSchema,
  type CreateOrganization,
} from "../../entity/organization.schema"

interface OrganizationFormProps {
  onSubmit: (data: CreateOrganization) => void
  isPending?: boolean
}

export function OrganizationForm({
  onSubmit,
  isPending,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganization>({
    resolver: effectSchemaResolver(CreateOrganizationSchema),
  })

  const handleFormSubmit = (data: CreateOrganization) => {
    onSubmit(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          {...register("name")}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <input
          id="description"
          {...register("description")}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Organization"}
      </button>
    </form>
  )
}
