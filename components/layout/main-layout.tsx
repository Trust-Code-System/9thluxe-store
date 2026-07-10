import type React from "react"
import { SiteHeader } from "@/components/SiteHeader"
import { SiteFooter } from "@/components/SiteFooter"

interface MainLayoutProps {
  children: React.ReactNode
  cartItemCount?: number
}

export function MainLayout({ children, cartItemCount }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}





