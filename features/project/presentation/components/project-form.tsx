"use client";

import { useForm } from "react-hook-form";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import { CreateProjectSchema } from "@/features/project/schema/project.schema.requests";
import type { CreateProjectInput, Organization } from "@/lib/api/types";
import type { ProjectFormError } from "../hooks/use-projects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  organizations: readonly Organization[];
  onSubmit: (data: CreateProjectInput) => Promise<unknown>;
  isPending?: boolean;
  submitError?: ProjectFormError | null;
};

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
  } = useForm<CreateProjectInput>({
    resolver: effectSchemaResolver<CreateProjectInput>(CreateProjectSchema),
    defaultValues: {
      organizationId: organizations[0]?.id,
    },
  });

  const handleFormSubmit = async (data: CreateProjectInput) => {
    try {
      await onSubmit(data);
      reset({ organizationId: organizations[0]?.id });
    } catch {}
  };

  const orgServerError =
    submitError?.field === "organizationId" ? submitError.message : undefined;
  const bannerError =
    submitError && submitError.field === null ? submitError.message : undefined;

  const noOrgs = organizations.length === 0;
  const disabled = isPending || noOrgs;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {noOrgs && (
        <Alert>
          <AlertDescription>
            Create an organization first — projects need to belong to one.
          </AlertDescription>
        </Alert>
      )}

      {bannerError && (
        <Alert variant="destructive">
          <AlertDescription>{bannerError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="organizationId">Organization</Label>
        <Select
          id="organizationId"
          disabled={noOrgs}
          aria-invalid={
            errors.organizationId || orgServerError ? true : undefined
          }
          {...register("organizationId")}
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        {(errors.organizationId || orgServerError) && (
          <p className="text-sm text-destructive">
            {errors.organizationId?.message ?? orgServerError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Website redesign"
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Optional description"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={disabled}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
