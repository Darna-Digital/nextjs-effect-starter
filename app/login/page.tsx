"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendVerificationEmail, signIn } from "@/lib/auth/auth-client";
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver";
import {
  SignInSchema,
  type SignInInput,
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

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: effectSchemaResolver<SignInInput>(SignInSchema),
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    setUnverified(null);

    const { error } = await signIn.email({ email, password });
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(email);
        return;
      }
      setFormError(error.message ?? "Invalid email or password.");
      return;
    }

    router.push("/organizations");
    router.refresh();
  });

  const resend = async () => {
    if (!unverified) return;
    await sendVerificationEmail({
      email: unverified,
      callbackURL: "/verify-email",
    });
    toast.success("Verification email sent — check the server console.");
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            New here?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create an account
            </Link>
            .
          </CardDescription>
        </CardHeader>

        <form onSubmit={onSubmit} noValidate>
          <CardContent className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Could not sign in</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {unverified && (
              <Alert>
                <AlertTitle>Verify your email first</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  <span>
                    We sent a verification link to {unverified}. Verify it before
                    signing in.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resend}
                  >
                    Resend verification email
                  </Button>
                </AlertDescription>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
