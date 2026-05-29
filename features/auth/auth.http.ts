import { Effect } from "effect";
import { cookies } from "next/headers";
import {
  RefreshTokenExpired,
  type PublicUser,
} from "@/features/auth/schema/auth.schema.model";
import { Auth } from "@/features/auth/service/auth.service";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const REFRESH_COOKIE_MAX_AGE = Number(
  process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60,
);

const isProd = process.env.NODE_ENV === "production";

function setAuthCookies(accessToken: string, refreshToken: string) {
  return Effect.promise(async () => {
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
    });
    jar.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/api/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  });
}

function clearAuthCookies() {
  return Effect.promise(async () => {
    const jar = await cookies();
    jar.delete({ name: ACCESS_COOKIE, path: "/" });
    jar.delete({ name: REFRESH_COOKIE, path: "/api/auth" });
  });
}

function getRefreshCookie() {
  return Effect.promise(async () => {
    const jar = await cookies();
    return jar.get(REFRESH_COOKIE)?.value ?? null;
  });
}

type Session = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export function completeSession(session: Session) {
  return setAuthCookies(session.accessToken, session.refreshToken).pipe(
    Effect.as({ user: session.user }),
  );
}

export function resumeSession() {
  return Effect.gen(function* () {
    const token = yield* getRefreshCookie();
    if (!token) {
      yield* clearAuthCookies();
      return yield* Effect.fail(new RefreshTokenExpired());
    }
    return yield* Auth.refresh(token).pipe(
      Effect.tapError(() => clearAuthCookies()),
    );
  });
}

export function endSession() {
  return Effect.gen(function* () {
    const token = yield* getRefreshCookie();
    if (token) yield* Auth.logout(token);
    yield* clearAuthCookies();
  });
}
