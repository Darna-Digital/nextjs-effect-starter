"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { sendVerificationEmail, useSession } from "@/lib/auth/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmail() {
  const params = useSearchParams();
  const linkError = params.get("error");
  const { data, isPending } = useSession();

  if (isPending) return null;

  const user = data?.user;
  const verified = !linkError && user?.emailVerified;

  const resend = async () => {
    if (!user?.email) return;
    await sendVerificationEmail({
      email: user.email,
      callbackURL: "/verify-email",
    });
    toast.success("Verification email sent — check the server console.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{verified ? "Email verified" : "Verify your email"}</CardTitle>
        <CardDescription>
          {verified
            ? "Your email address is confirmed. You're all set."
            : linkError
              ? "That verification link is invalid or has expired."
              : "Click the link in the email we sent to finish verifying."}
        </CardDescription>
      </CardHeader>

      {verified ? (
        <CardFooter>
          <Link href="/organizations" className={buttonVariants()}>
            Continue
          </Link>
        </CardFooter>
      ) : (
        <>
          <CardContent className="text-sm text-muted-foreground">
            {user
              ? `Signed in as ${user.email}.`
              : "Sign in to resend a verification email."}
          </CardContent>
          <CardFooter className="gap-3">
            {user ? (
              <Button type="button" variant="outline" onClick={resend}>
                Resend verification email
              </Button>
            ) : (
              <Link href="/login" className={buttonVariants()}>
                Go to sign in
              </Link>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </main>
  );
}
