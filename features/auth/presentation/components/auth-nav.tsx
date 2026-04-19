"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCurrentUser, useLogout } from "../hooks/use-auth"

export function AuthNav() {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()

  if (isLoading) return null

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-x-4">
        <Link
          href="/login"
          className="font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-indigo-600 px-2.5 py-1 text-white hover:bg-indigo-500"
        >
          Register
        </Link>
      </div>
    )
  }

  return (
    <div className="ml-auto flex items-center gap-x-4">
      <span className="text-gray-500 dark:text-gray-400">{user.email}</span>
      <button
        onClick={() => {
          logout.mutate(undefined, {
            onSuccess: () => router.push("/login"),
          })
        }}
        className="font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400"
      >
        Sign out
      </button>
    </div>
  )
}
