import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { Context, Effect } from "effect";
import { SignJWT, jwtVerify } from "jose";
import {
  RefreshTokenRepository,
  UserRepository,
} from "@/features/auth/repository/auth.repository";
import {
  EmailAlreadyTaken,
  InvalidCredentials,
  RefreshTokenExpired,
  TokenSigningFailed,
  toPublicUser,
  type PublicUser,
  type RefreshTokenRecord,
  type UserRecord,
} from "@/features/auth/schema/auth.schema.model";
import type {
  Login,
  Register,
} from "@/features/auth/schema/auth.schema.requests";

export class JwtSecret extends Context.Tag("JwtSecret")<
  JwtSecret,
  Uint8Array
>() {}

export class JwtExpiresIn extends Context.Tag("JwtExpiresIn")<
  JwtExpiresIn,
  string
>() {}

export class RefreshTokenTtlSeconds extends Context.Tag(
  "RefreshTokenTtlSeconds",
)<RefreshTokenTtlSeconds, number>() {}

const SCRYPT_KEY_LEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function generateRefreshToken() {
  return randomBytes(32).toString("hex");
}

function hashRefreshToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export class Auth extends Effect.Service<Auth>()("Auth", {
  accessors: true,
  effect: Effect.gen(function* () {
    const users = yield* UserRepository;
    const refreshTokens = yield* RefreshTokenRepository;
    const secret = yield* JwtSecret;
    const expiresIn = yield* JwtExpiresIn;
    const refreshTtlSeconds = yield* RefreshTokenTtlSeconds;

    function signAccessToken(user: UserRecord) {
      return Effect.tryPromise({
        try: () =>
          new SignJWT({ email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(secret),
        catch: (cause) => {
          console.error("TokenSigningFailed", cause);
          return new TokenSigningFailed();
        },
      });
    }

    function mintRefreshToken(userId: string) {
      const raw = generateRefreshToken();
      const record: RefreshTokenRecord = {
        id: hashRefreshToken(raw),
        userId,
        expiresAt: new Date(
          Date.now() + refreshTtlSeconds * 1000,
        ).toISOString(),
        createdAt: new Date().toISOString(),
      };
      return { raw, record };
    }

    function issueSession(user: UserRecord) {
      return Effect.gen(function* () {
        const accessToken = yield* signAccessToken(user);
        const { raw, record } = mintRefreshToken(user.id);
        yield* refreshTokens.create(record);
        return { user: toPublicUser(user), accessToken, refreshToken: raw };
      });
    }

    return {
      register: (input: Register) =>
        Effect.gen(function* () {
          const existing = yield* users.findByEmail(input.email);
          if (existing)
            return yield* Effect.fail(
              new EmailAlreadyTaken({ email: input.email }),
            );

          const user: UserRecord = {
            id: crypto.randomUUID(),
            email: input.email,
            passwordHash: hashPassword(input.password),
            createdAt: new Date().toISOString(),
          };

          yield* users.create(user);
          const session = yield* issueSession(user);

          yield* Effect.logInfo("User registered").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          );

          return session;
        }).pipe(Effect.withSpan("Auth.register")),

      login: (input: Login) =>
        Effect.gen(function* () {
          const user = yield* users.findByEmail(input.email);
          if (!user) return yield* Effect.fail(new InvalidCredentials());
          if (!verifyPassword(input.password, user.passwordHash))
            return yield* Effect.fail(new InvalidCredentials());

          const session = yield* issueSession(user);

          yield* Effect.logInfo("User logged in").pipe(
            Effect.annotateLogs({ "user.id": user.id }),
          );

          return session;
        }).pipe(Effect.withSpan("Auth.login")),

      refresh: (rawToken: string) =>
        Effect.gen(function* () {
          const oldId = hashRefreshToken(rawToken);

          const record = yield* refreshTokens.get(oldId);
          if (!record) return yield* Effect.fail(new RefreshTokenExpired());

          if (new Date(record.expiresAt) <= new Date()) {
            yield* refreshTokens.remove(oldId);
            return yield* Effect.fail(new RefreshTokenExpired());
          }

          const user = yield* users.get(record.userId);
          if (!user) {
            yield* refreshTokens.remove(oldId);
            return yield* Effect.fail(new RefreshTokenExpired());
          }

          const accessToken = yield* signAccessToken(user);
          const { raw: newRaw, record: newRecord } = mintRefreshToken(user.id);

          yield* refreshTokens.rotate(oldId, newRecord);

          return {
            user: toPublicUser(user),
            accessToken,
            refreshToken: newRaw,
          };
        }).pipe(Effect.withSpan("Auth.refresh")),

      logout: (rawToken: string) =>
        refreshTokens
          .remove(hashRefreshToken(rawToken))
          .pipe(Effect.withSpan("Auth.logout")),

      verifyToken: (token: string) =>
        Effect.tryPromise({
          try: async () => {
            const { payload } = await jwtVerify(token, secret);
            return {
              id: payload.sub!,
              email: payload.email as string,
            } satisfies PublicUser;
          },
          catch: () => new InvalidCredentials(),
        }).pipe(Effect.withSpan("Auth.verifyToken")),
    };
  }),
}) {}
