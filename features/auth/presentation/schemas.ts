import { Schema as S } from "effect";

/**
 * Effect `Schema`s used purely as client-side form validators (via
 * {@link ../../../lib/effect/form/effect-schema-resolver}). Keeping validation
 * in Effect `Schema` avoids introducing a second schema library.
 */
export const Email = S.Trim.pipe(
  S.check(
    S.isLowercased(),
    S.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "Enter a valid email address",
    }),
  ),
);

export const Password = S.String.pipe(
  S.check(
    S.isMinLength(8, { message: "Password must be at least 8 characters" }),
    S.isMaxLength(256),
  ),
);

export const Name = S.Trim.pipe(
  S.check(
    S.isMinLength(1, { message: "Name is required" }),
    S.isMaxLength(255),
  ),
);

export const SignInSchema = S.Struct({
  email: Email,
  password: S.String.pipe(
    S.check(S.isMinLength(1, { message: "Password is required" })),
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
