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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Name
        </label>
        <div className="mt-2">
          <input
            id="name"
            placeholder="Acme Inc."
            {...register("name")}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"
          />
        </div>
        {errors.name && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Description
        </label>
        <div className="mt-2">
          <input
            id="description"
            placeholder="Optional description"
            {...register("description")}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"
          />
        </div>
        {errors.description && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  )
}
