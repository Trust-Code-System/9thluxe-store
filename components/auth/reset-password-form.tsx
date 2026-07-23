"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Logo } from "@/components/logo"

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [complete, setComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (token && password !== confirmation) {
      setError("Passwords do not match.")
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(
        token ? "/api/reset-password/confirm" : "/api/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(token ? { token, password } : { email }),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "The request could not be completed.")
        return
      }
      setComplete(true)
    } catch {
      setError("The request could not be completed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const heading = token ? "Choose a new password" : "Reset your password"
  const description = token
    ? "Use at least eight characters. This reset link can only be used once."
    : "Enter your email address and we will send you a secure, single-use reset link."

  return (
    <div
      data-surface="night"
      className="veil grain relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <div className="relative z-10 w-full max-w-md space-y-8 border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-9">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <Logo href="/" />
          </div>
          <p className="eyebrow">Account recovery</p>
          <h1 className="mt-3 font-serif text-3xl font-light">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>

        {complete ? (
          <div className="space-y-5">
            <div className="border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
              {token
                ? "Your password has been updated. You can now sign in."
                : "If an account exists for that email, a reset link has been sent."}
            </div>
            <Link
              href="/auth/signin"
              className="inline-flex h-12 w-full items-center justify-center bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {token ? (
              <>
                <label className="block text-sm font-medium" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full border border-input bg-background/60 px-3 outline-none focus:border-accent"
                />
                <label className="block text-sm font-medium" htmlFor="confirmation">
                  Confirm new password
                </label>
                <input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="h-12 w-full border border-input bg-background/60 px-3 outline-none focus:border-accent"
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full border border-input bg-background/60 px-3 outline-none focus:border-accent"
                />
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
            >
              {isLoading
                ? "Processing..."
                : token
                  ? "Update password"
                  : "Send reset link"}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
