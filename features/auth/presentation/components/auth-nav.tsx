"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";

export function AuthNav() {
  const router = useRouter();
  const { data, isPending } = useSession();

  if (isPending) return null;

  const user = data?.user;

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-x-2">
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Sign in
        </Link>
        <Link href="/register" className={buttonVariants({ size: "sm" })}>
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-x-3">
      <span className="text-muted-foreground">{user.email}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/login");
                router.refresh();
              },
            },
          })
        }
      >
        Sign out
      </Button>
    </div>
  );
}
