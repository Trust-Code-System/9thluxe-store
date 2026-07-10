import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"

import { CheckoutContent } from "@/components/checkout/checkout-content"

import { getCommerceConfig } from "@/lib/config/commerce"



export const metadata: Metadata = {

  title: "Checkout | Fàdè",

  description: "Complete your order securely.",

}



export const dynamic = "force-dynamic"



export default function CheckoutPage() {

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
