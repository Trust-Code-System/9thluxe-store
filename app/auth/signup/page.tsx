import type { Metadata } from "next"
import Link from "next/link"
import { SignUpForm } from "@/components/auth/signup-form"
import { Logo } from "@/components/logo"

export const metadata: Metadata = {
  title: "Create Account | Fádé",
  description: "Create your Fádé account to start shopping.",
}

export default function SignUpPage() {
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
            Begin your <em className="text-accent">trail</em>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Create an account for faster checkout and order tracking
          </p>
        </div>

        {/* Form */}
        <SignUpForm />

        {/* Sign In Link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-accent underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
