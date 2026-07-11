"use client";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email. Please try again.");
        return;
      }

      // Store the reset link for development
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }

      setSent(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="mt-3 font-serif text-3xl font-light text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <p className="font-medium mb-1">Check your email</p>
              <p>
                If an account exists for <strong>{email}</strong>, a password
                reset link has been sent to your inbox.
              </p>
            </div>

            {/* Development: Show reset link */}
            {resetLink && (
              <div className="border border-border bg-secondary p-4 text-sm">
                <p className="mb-2 font-medium text-foreground">
                  Development mode reset link:
                </p>
                <a
                  href={resetLink}
                  className="break-all text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetLink}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 h-12 w-full border border-input bg-background/60 px-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || sent}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || sent}
                className="inline-flex h-12 w-full items-center justify-center bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
