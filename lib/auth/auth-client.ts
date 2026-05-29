"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client. Talks to the `/api/auth/*` handler; the
 * session cookie is set/cleared automatically. `baseURL` is inferred from the
 * current origin in the browser.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? process.env.BETTER_AUTH_URL
      : window.location.origin,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient;
