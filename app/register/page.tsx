"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";
import {
  parseAuthError,
  useRegister,
} from "@/features/auth/presentation/hooks/use-auth";

export default function RegisterPage() {
  const router = useRouter();
  const mutation = useRegister();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5 dark:border-white/10">
          <h1 className="text-base/7 font-semibold text-gray-900 dark:text-white">
            Create an account
          </h1>
          <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">
            Already have one?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Sign in
            </Link>
            .
          </p>
        </div>

        <AuthForm
          mode="register"
          isPending={mutation.isPending}
          submitError={parseAuthError(mutation.error)}
          onSubmit={async (data) => {
            await mutation.mutateAsync(data);
            router.push("/organizations");
          }}
        />
      </div>
    </main>
  );
}
