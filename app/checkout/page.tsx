import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import { getCommerceConfig } from "@/lib/config/commerce"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Checkout | Fádé",
  description: "Complete your order securely.",
}

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  await requireUser("/checkout")

  const { shipping } = getCommerceConfig()

  return (
    <MainLayout>
      <CheckoutContent
        items={[]}
        freeShippingThreshold={shipping.freeShippingThreshold}
        flatShippingFee={shipping.flatShippingFee}
      />
    </MainLayout>
  )
}
