import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Password | Fádé",
  description: "Request a secure password reset or choose a new password.",
}

type PageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token?.trim() || null} />
}
