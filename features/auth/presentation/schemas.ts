import { Schema as S } from "effect";

export const Email = S.Trim.pipe(
  S.lowercased(),
  S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: () => "Enter a valid email address",
  }),
);

export const Password = S.String.pipe(
  S.minLength(8, { message: () => "Password must be at least 8 characters" }),
  S.maxLength(256),
);

export const Name = S.Trim.pipe(
  S.minLength(1, { message: () => "Name is required" }),
  S.maxLength(255),
);

export const SignInSchema = S.Struct({
  email: Email,
  password: S.String.pipe(
    S.minLength(1, { message: () => "Password is required" }),
  ),
});
export type SignInInput = typeof SignInSchema.Type;

export const SignUpSchema = S.Struct({
  name: Name,
  email: Email,
  password: Password,
});
export type SignUpInput = typeof SignUpSchema.Type;

export const ForgotPasswordSchema = S.Struct({ email: Email });
export type ForgotPasswordInput = typeof ForgotPasswordSchema.Type;

export const ResetPasswordSchema = S.Struct({ password: Password });
export type ResetPasswordInput = typeof ResetPasswordSchema.Type;
