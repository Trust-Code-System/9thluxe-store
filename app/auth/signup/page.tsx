import type { Metadata } from "next"
import Link from "next/link"
import { SignUpForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Create Account | Fádé",
  description: "Create your Fádé account to start shopping.",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-semibold">
            Fádé
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-semibold">Create an account</h1>
          <p className="mt-2 text-muted-foreground">Join Fádé for exclusive access to luxury</p>
        </div>

        {/* Form */}
        <SignUpForm />

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
