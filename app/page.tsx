"use client";

import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  LayoutGrid,
  MailCheck,
  Workflow,
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Workflow,
    title: "Effect HTTP API",
    description:
      "Typed endpoints, services, and repositories with an OpenAPI-derived client — end to end, no casts.",
  },
  {
    icon: KeyRound,
    title: "Better Auth",
    description:
      "Email & password sessions validated inside Effect middleware, with the OpenAPI plugin enabled.",
  },
  {
    icon: MailCheck,
    title: "Full email flows",
    description:
      "Email verification on sign-up and password reset, wired through a single pluggable send-email seam.",
  },
  {
    icon: LayoutGrid,
    title: "shadcn/ui + Tailwind v4",
    description:
      "Accessible components and design tokens, with the Inter typeface and a neutral, themeable palette.",
  },
];

export default function Home() {
  const { data, isPending } = useSession();
  const user = data?.user;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20 sm:py-28">
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          Next.js 16 · Effect · Better Auth
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          A type-safe full-stack starter
        </h1>

        <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
          Effect on the server, Better Auth for sessions, and a generated,
          fully-typed client on the front end. Clone it and start building.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isPending ? null : user ? (
            <Link
              href="/organizations"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Go to your organizations
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Create an account
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                <Icon className="size-4.5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-pretty">
                {description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <a href="/api/docs" className="transition-colors hover:text-foreground">
          API reference
        </a>
        <a
          href="/api/auth/reference"
          className="transition-colors hover:text-foreground"
        >
          Auth reference
        </a>
        <a
          href="https://github.com/kitlangton/effect-better-auth-example"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          Effect × Better Auth example
        </a>
      </section>
    </main>
  );
}
