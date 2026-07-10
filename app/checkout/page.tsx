import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"

import { CheckoutContent } from "@/components/checkout/checkout-content"

import { dummyProducts } from "@/lib/dummy-data"



export const metadata: Metadata = {

  title: "Checkout | Fàdè",

  description: "Complete your order securely.",

}



// Dummy order items

const orderItems = [

  { product: dummyProducts[0], quantity: 1 },

  { product: dummyProducts[1], quantity: 2 },

]



export default function CheckoutPage() {

  return (

    <MainLayout cartItemCount={3}>

      <CheckoutContent items={orderItems} />

    </MainLayout>

  )

}
