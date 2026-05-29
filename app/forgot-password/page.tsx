"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { requestPasswordReset } from "@/lib/auth/auth-client";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/presentation/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: effectSchemaResolver<ForgotPasswordInput>(ForgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);

    const { error } = await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setFormError(error.message ?? "Could not send the reset email.");
      return;
    }

    setSentTo(email);
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {sentTo
              ? `If an account exists for ${sentTo}, a reset link is on its way.`
              : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>

        {sentTo ? (
          <CardFooter>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="mt-6 flex-col items-stretch gap-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:underline"
              >
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </main>
  );
}
