import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

// Better Auth owns `/api/auth/*`. This route is more specific than the Effect
// catch-all at `app/api/[[...slug]]`, so Next.js routes auth requests here.
export const { POST, GET } = toNextJsHandler(auth);
