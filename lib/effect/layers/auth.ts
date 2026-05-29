import { Context } from "effect";
import type { Session } from "@/lib/auth/auth";

export type User = Session["user"];

export class CurrentUser extends Context.Service<CurrentUser, User>()(
  "CurrentUser",
) {}
