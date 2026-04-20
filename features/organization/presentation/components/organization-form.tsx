"use client";

import { useForm } from "react-hook-form";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import {
  CreateOrganizationSchema,
  type CreateOrganization,
} from "@/features/organization/schema/organization.schema.requests";
import type { OrganizationFieldError } from "../hooks/use-organizations";

interface OrganizationFormProps {
  /**
   * Called on submit. Should return a promise — the form resets only
   * when the promise resolves, so server-side errors stay visible with
   * the user's input intact.
   */
  onSubmit: (data: CreateOrganization) => Promise<unknown>;
  isPending?: boolean;
  /** Structured error from the most recent submit. */
  submitError?: OrganizationFieldError | null;
}

export function OrganizationForm({
  onSubmit,
  isPending,
  submitError,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganization>({
    resolver: effectSchemaResolver(CreateOrganizationSchema),
  });

  const handleFormSubmit = async (data: CreateOrganization) => {
    try {
      await onSubmit(data);
      reset();
    } catch {
      // Keep the user's input so they can correct it; the parent renders
      // the typed error via `submitError`.
    }
  };

  const nameServerError =
    submitError?.field === "name" ? submitError.message : undefined;
  const bannerError =
    submitError && submitError.field === null ? submitError.message : undefined;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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
          htmlFor="name"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Name
        </label>
        <div className="mt-2">
          <input
            id="name"
            placeholder="Acme Inc."
            aria-invalid={errors.name || nameServerError ? true : undefined}
            {...register("name")}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"
          />
        </div>
        {errors.name && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.name.message}
          </p>
        )}
        {!errors.name && nameServerError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {nameServerError}
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
  );
}
