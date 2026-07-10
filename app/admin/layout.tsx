import type React from "react"

import type { Metadata } from "next"

import { AdminSidebar } from "@/components/admin/admin-sidebar"

import { AdminHeader } from "@/components/admin/admin-header"

import { ThemeProvider } from "@/components/theme-provider"



export const metadata: Metadata = {

  title: "Admin Dashboard | Fàdè",

  description: "Manage your Fàdè store.",

}



export default function AdminLayout({ children }: { children: React.ReactNode }) {

  return (

    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

      <div className="flex min-h-screen bg-background">

        <AdminSidebar />

        <div className="flex-1 flex flex-col lg:ml-64">

          <AdminHeader />

          <main className="flex-1 p-6 lg:p-8">{children}</main>

        </div>

      </div>

    </ThemeProvider>

  )

}
