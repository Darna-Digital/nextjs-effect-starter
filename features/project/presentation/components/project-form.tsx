"use client";

import { useForm } from "react-hook-form";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import {
  CreateProjectSchema,
  type CreateProject,
} from "@/features/project/schema/project.schema.requests";
import type { Organization } from "@/features/organization/schema/organization.schema.model";
import type { ProjectFormError } from "../hooks/use-projects";

type Props = {
  organizations: readonly Organization[];
  /** Resolve on success, reject on failure. Form only resets on resolve. */
  onSubmit: (data: CreateProject) => Promise<unknown>;
  isPending?: boolean;
  submitError?: ProjectFormError | null;
}

export function ProjectForm({
  organizations,
  onSubmit,
  isPending,
  submitError,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProject>({
    resolver: effectSchemaResolver(CreateProjectSchema),
    defaultValues: {
      organizationId: organizations[0]?.id,
    },
  });

  const handleFormSubmit = async (data: CreateProject) => {
    try {
      await onSubmit(data);
      reset({ organizationId: organizations[0]?.id });
    } catch {
      // Keep user's input visible so they can correct and retry.
    }
  };

  const orgServerError =
    submitError?.field === "organizationId" ? submitError.message : undefined;
  const bannerError =
    submitError && submitError.field === null ? submitError.message : undefined;

  const disabled = isPending || organizations.length === 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {organizations.length === 0 && (
        <div
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30"
        >
          Create an organization first — projects need to belong to one.
        </div>
      )}

      {bannerError && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20"
        >
          {bannerError}
        </div>
      )}

      <div>
        <label
          htmlFor="organizationId"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Organization
        </label>
        <div className="mt-2">
          <select
            id="organizationId"
            disabled={organizations.length === 0}
            aria-invalid={
              errors.organizationId || orgServerError ? true : undefined
            }
            {...register("organizationId")}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:opacity-50 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        {errors.organizationId && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.organizationId.message}
          </p>
        )}
        {!errors.organizationId && orgServerError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {orgServerError}
          </p>
        )}
      </div>

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
            placeholder="Website redesign"
            aria-invalid={errors.name ? true : undefined}
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
          disabled={disabled}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
