"use client";

import { useForm } from "react-hook-form";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import { CreateOrganizationSchema } from "@/features/organization/schema/organization.schema.requests";
import type { CreateOrganizationInput } from "@/lib/api/types";
import type { OrganizationFieldError } from "../hooks/use-organizations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  onSubmit: (data: CreateOrganizationInput) => Promise<unknown>;
  isPending?: boolean;
  submitError?: OrganizationFieldError | null;
};

export function OrganizationForm({ onSubmit, isPending, submitError }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: effectSchemaResolver<CreateOrganizationInput>(
      CreateOrganizationSchema,
    ),
  });

  const handleFormSubmit = async (data: CreateOrganizationInput) => {
    try {
      await onSubmit(data);
      reset();
    } catch {}
  };

  const nameServerError =
    submitError?.field === "name" ? submitError.message : undefined;
  const bannerError =
    submitError && submitError.field === null ? submitError.message : undefined;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {bannerError && (
        <Alert variant="destructive">
          <AlertDescription>{bannerError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Acme Inc."
          aria-invalid={errors.name || nameServerError ? true : undefined}
          {...register("name")}
        />
        {(errors.name || nameServerError) && (
          <p className="text-sm text-destructive">
            {errors.name?.message ?? nameServerError}
          </p>
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
