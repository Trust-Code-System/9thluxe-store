import type { Metadata } from "next"

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
  await auth()

  const { shipping } = getCommerceConfig()

  return (

    <MainLayout>

      <section data-surface="day" className="min-h-[60vh] bg-background text-foreground">
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-16">

          <div className="mb-10">
            <span className="eyebrow">Your selection</span>
            <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">
              The bag
            </h1>
          </div>

          <CartContent
            freeShippingThreshold={shipping.freeShippingThreshold}
            flatShippingFee={shipping.flatShippingFee}
          />

        </div>
      </section>

    </MainLayout>

  )

}
