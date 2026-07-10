import type React from "react"

import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"

import { AccountSidebar } from "@/components/account/account-sidebar"



export const metadata: Metadata = {

  title: "My Account | Fàdè",

  description: "Manage your Fàdè account.",

}



export default function AccountLayout({ children }: { children: React.ReactNode }) {

  return (

    <MainLayout cartItemCount={3}>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-8">My Account</h1>

        <div className="flex flex-col lg:flex-row gap-8">

          <AccountSidebar />

          <div className="flex-1">{children}</div>

        </div>

      </div>

    </MainLayout>

  )

}
