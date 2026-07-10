import type { Metadata } from "next"

import { redirect } from "next/navigation"

import { MainLayout } from "@/components/layout/main-layout"

import { CartContent } from "@/components/cart/cart-content"

import { auth } from "@/lib/auth"

import { getCommerceConfig } from "@/lib/config/commerce"

export const metadata: Metadata = {

  title: "Shopping Cart | Fádé",

  description: "Review your shopping cart and proceed to checkout.",

}

export const dynamic = "force-dynamic"

export default async function CartPage() {

  // Check authentication - cart should be accessible to all users (guest or authenticated)
  // But we'll ensure the cart is user-scoped on the client side
  const session = await auth()

  const { shipping } = getCommerceConfig()

  return (

    <MainLayout>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        <div className="mb-8">
          <span className="eyebrow">Your selection</span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl">Shopping Bag</h1>
        </div>

        <CartContent
          freeShippingThreshold={shipping.freeShippingThreshold}
          flatShippingFee={shipping.flatShippingFee}
        />

      </div>

    </MainLayout>

  )

}
