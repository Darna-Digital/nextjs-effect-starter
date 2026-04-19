import { Layer } from "effect"
import { createMysqlStorageLayer } from "@/lib/effect/layers/storage/storage.mysql"
import { db } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import type { UserRecord } from "./auth.model"
import { Auth, JwtExpiresIn, JwtSecret, UserStorage } from "./auth.service"

const secret = process.env.AUTH_SECRET
if (!secret) {
  throw new Error(
    "AUTH_SECRET is not set. Add a long random string to .env.local.",
  )
}

const encodedSecret = new TextEncoder().encode(secret)
const expiresIn = process.env.AUTH_JWT_EXPIRES_IN ?? "7d"

/** Layer that provides `Auth` backed by MySQL + HS256 JWTs. */
export const AuthLive = Auth.Default.pipe(
  Layer.provide(
    Layer.mergeAll(
      Layer.succeed(
        UserStorage,
        createMysqlStorageLayer<UserRecord>(db, users),
      ),
      Layer.succeed(JwtSecret, encodedSecret),
      Layer.succeed(JwtExpiresIn, expiresIn),
    ),
  ),
)
