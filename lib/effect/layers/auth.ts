import { Context } from "effect";
import type { Session } from "@/lib/auth/auth";

/**
 * The authenticated user, as resolved by Better Auth's session. Provided by the
 * {@link ../../features/auth/http/auth.middleware Authentication} middleware and
 * consumed by protected handlers/services. Shape tracks Better Auth so it stays
 * in sync (id, email, name, emailVerified, image, timestamps).
 */
export type User = Session["user"];

export class CurrentUser extends Context.Service<CurrentUser, User>()(
  "CurrentUser",
) {}
