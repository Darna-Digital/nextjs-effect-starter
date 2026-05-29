import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { AuthNav } from "@/features/auth/presentation/components/auth-nav";
import "./globals.css";

// Registered as `--font-sans` so the `font-sans` utility (mapped in globals.css)
// resolves to Inter. `antialiased` + body `@apply font-sans` do the rest.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nextjs-effect-starter",
  description: "A Next.js 16 starter with Effect and Better Auth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <nav className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-7xl items-center gap-x-6 px-4 py-3 text-sm sm:px-6 lg:px-8">
              <Link href="/" className="font-semibold tracking-tight">
                effect&nbsp;starter
              </Link>
              <Link
                href="/organizations"
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Organizations
              </Link>
              <Link
                href="/projects"
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Projects
              </Link>
              <AuthNav />
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
