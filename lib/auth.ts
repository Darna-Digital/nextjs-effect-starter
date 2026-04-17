import { Context, Schema as S } from "effect"

export const UserSchema = S.Struct({
  id: S.String,
  email: S.String,
})
export type User = typeof UserSchema.Type

/**
 * The user making the current request. Bound at the HTTP edge by the
 * route handler; every feature that depends on identity reads it from
 * context rather than taking a `userId` parameter.
 */
export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  User
>() {}
