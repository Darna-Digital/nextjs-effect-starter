import { Context, Schema as S } from "effect";
import { UserId } from "@/features/auth/schema/auth.schema.model";

export const UserSchema = S.Struct({
  id: UserId,
  email: S.String,
});
export type User = typeof UserSchema.Type;

export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  User
>() {}
