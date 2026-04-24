import { Context, Schema as S } from "effect";

export const UserSchema = S.Struct({
  id: S.String,
  email: S.String,
});
export type User = typeof UserSchema.Type;

export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  User
>() {}
