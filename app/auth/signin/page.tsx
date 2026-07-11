import type { Metadata } from "next"
import Link from "next/link"
import { SignInForm } from "@/components/auth/signin-form"
import { Logo } from "@/components/logo"

export const metadata: Metadata = {
  title: "Sign In | Fádé",
  description: "Sign in to your Fádé account.",
}

export default function SignInPage() {
  return (
    <div
      data-surface="night"
      className="veil grain relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="flex justify-center">
            <Logo href="/" />
          </div>
          <h1 className="mt-8 font-serif text-3xl font-light">
            Welcome <em className="text-accent">back</em>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <SignInForm />

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-accent underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
