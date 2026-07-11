import type React from "react"

import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"

import { AccountSidebar } from "@/components/account/account-sidebar"

import { requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export const metadata: Metadata = {

  title: "My Account | Fádé",

  description: "Manage your Fádé account.",

}

export const dynamic = "force-dynamic"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {

  // Require authentication - will redirect to sign in if not authenticated

  const user = await requireUser()
  if (user.role === "ADMIN") {
    redirect("/admin")
  }

  return (

    <MainLayout>

      <section data-surface="day" className="min-h-[60vh] bg-background text-foreground">
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

          <div className="mb-10">
            <span className="eyebrow">Your house account</span>
            <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">
              My account
            </h1>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">

            <AccountSidebar />

            <div className="min-w-0 flex-1">{children}</div>

          </div>

        </div>
      </section>

    </MainLayout>

  )

}
