import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import { getCommerceConfig } from "@/lib/config/commerce"
import { getBankTransferConfig } from "@/lib/config/payment-methods"
import { requireUser } from "@/lib/session"
import { env } from "@/lib/env"
import { isPaymentCollectionEnabled } from "@/integrations/payments/policy"

export const metadata: Metadata = {
  title: "Checkout | Fádé",
  description: "Complete your order securely.",
}

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  await requireUser("/checkout")

  const { shipping } = getCommerceConfig()
  const bankTransfer = getBankTransferConfig()
  const paymentsEnabled = isPaymentCollectionEnabled(
    env.PAYMENTS_ENABLED,
    env.PAYSTACK_SECRET_KEY,
  )

  return (
    <MainLayout>
      <CheckoutContent
        items={[]}
        freeShippingThreshold={shipping.freeShippingThreshold}
        flatShippingFee={shipping.flatShippingFee}
        expressShippingFee={shipping.expressShippingFee}
        giftWrapFee={shipping.giftWrapFee}
        bankTransfer={bankTransfer}
        paymentsEnabled={paymentsEnabled}
      />
    </MainLayout>
  )
}
