import type { Metadata } from "next"

import { MainLayout } from "@/components/layout/main-layout"

import { CartContent } from "@/components/cart/cart-content"

import { dummyProducts } from "@/lib/dummy-data"



export const metadata: Metadata = {

  title: "Shopping Cart | Fàdè",

  description: "Review your shopping cart and proceed to checkout.",

}



// Dummy cart items for UI demo

const cartItems = [

  { product: dummyProducts[0], quantity: 1 },

  { product: dummyProducts[1], quantity: 2 },

  { product: dummyProducts[4], quantity: 1 },

]



export default function CartPage() {

  return (

    <MainLayout cartItemCount={4}>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-8">Shopping Cart</h1>

        <CartContent initialItems={cartItems} />

      </div>

    </MainLayout>

  )

}
