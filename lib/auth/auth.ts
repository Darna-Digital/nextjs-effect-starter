import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { openAPI } from "better-auth/plugins";
import { db } from "@/lib/db/client";
import { account, session, user, verification } from "@/lib/db/schema";
import { sendEmail } from "@/lib/auth/email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password:\n\n${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email:\n\n${url}`,
      });
    },
  },
  plugins: [openAPI(), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
