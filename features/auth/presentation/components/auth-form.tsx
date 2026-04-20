"use client"

import { useForm } from "react-hook-form"
import { effectSchemaResolver } from "@/lib/effect/form/effect-schema-resolver"
import { LoginSchema, RegisterSchema } from "@/features/auth/schema/auth.schema.requests"
import type { Login, Register } from "@/features/auth/schema/auth.schema.requests"
import type { AuthFieldError } from "../hooks/use-auth"

type Mode = "login" | "register"

interface AuthFormProps {
  mode: Mode
  onSubmit: (data: Register | Login) => Promise<unknown>
  isPending?: boolean
  submitError?: AuthFieldError | null
}

const inputClass =
  "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500 sm:text-sm/6"

export function AuthForm({
  mode,
  onSubmit,
  isPending,
  submitError,
}: AuthFormProps) {
  const schema = mode === "register" ? RegisterSchema : LoginSchema
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Register | Login>({
    resolver: effectSchemaResolver(schema),
  })

  const submit = async (data: Register | Login) => {
    try {
      await onSubmit(data)
      reset()
    } catch {
      // Keep user's input; parent renders `submitError` inline.
    }
  }

  const emailServerError =
    submitError?.field === "email" ? submitError.message : undefined
  const passwordServerError =
    submitError?.field === "password" ? submitError.message : undefined
  const bannerError =
    submitError && submitError.field === null ? submitError.message : undefined

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {bannerError && (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20"
        >
          {bannerError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Email
        </label>
        <div className="mt-2">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email || emailServerError ? true : undefined}
            {...register("email")}
            className={inputClass}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
        {!errors.email && emailServerError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {emailServerError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Password
        </label>
        <div className="mt-2">
          <input
            id="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="••••••••"
            aria-invalid={
              errors.password || passwordServerError ? true : undefined
            }
            {...register("password")}
            className={inputClass}
          />
        </div>
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
        {!errors.password && passwordServerError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {passwordServerError}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isPending
            ? mode === "register"
              ? "Creating account..."
              : "Signing in..."
            : mode === "register"
              ? "Create account"
              : "Sign in"}
        </button>
      </div>
    </form>
  )
}
