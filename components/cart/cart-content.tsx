"use client"



import * as React from "react"

import Link from "next/link"

import { ShoppingBag } from "lucide-react"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { CartItem } from "./cart-item"

import { CartSummary } from "./cart-summary"

import { useCartStore } from "@/lib/stores/cart-store"



interface CartContentProps {
  freeShippingThreshold?: number
  flatShippingFee?: number
}

export function CartContent({ freeShippingThreshold, flatShippingFee }: CartContentProps = {}) {

  const cartItems = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const getTotalItems = useCartStore((state) => state.getTotalItems)



  // Use cart items directly - they already contain all necessary product data
  const items = React.useMemo(() => {
    return cartItems.map((cartItem) => ({
      product: {
        id: cartItem.id,
        slug: cartItem.slug,
        name: cartItem.name,
        brand: cartItem.brand,
        price: cartItem.price,
        image: cartItem.image,
        // Add default values for fields that CartItem might expect
        description: "",
        rating: 0,
        reviewCount: 0,
        category: "perfumes" as const,
        images: [cartItem.image],
      },
      quantity: cartItem.quantity,
    }))
  }, [cartItems])



  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId)
      return
    }
    try {
      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity: newQuantity }),
      })
      if (res.ok) await useCartStore.getState().syncFromServer()
    } catch {
      toast.error("Could not update quantity")
    }
  }

  const handleRemoveItem = async (productId: string) => {
    const item = items.find((i) => i.product.id === productId)
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        await useCartStore.getState().syncFromServer()
        toast.success("Item removed", {
          description: `${item?.product.name} has been removed from your cart.`,
        })
      } else {
        toast.error("Could not remove item")
      }
    } catch {
      toast.error("Could not remove item")
    }
  }



  const subtotal = getTotalPrice()

  const itemCount = getTotalItems()



  if (items.length === 0) {

    return (

      <div className="mx-auto max-w-md border border-dashed border-border bg-background px-8 py-16 text-center">

        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/12">

          <ShoppingBag className="h-7 w-7 text-accent" />

        </div>

        <h2 className="mb-2 font-serif text-2xl font-light text-foreground">Your bag is empty</h2>

        <p className="mb-8 text-muted-foreground">Discover a fragrance worth carrying home.</p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">

          <Button asChild>

            <Link href="/shop">Shop perfumes</Link>

          </Button>

          <Button asChild variant="outline" className="bg-transparent">

            <Link href="/concierge">Ask the Concierge</Link>

          </Button>

        </div>

      </div>

    )

  }



  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

      {/* Cart Items */}

      <div className="lg:col-span-2 space-y-4">

        {items.map((item) => (

          <CartItem

            key={item.product.id}

            product={item.product}

            quantity={item.quantity}

            onUpdateQuantity={(qty) => handleUpdateQuantity(item.product.id, qty)}

            onRemove={() => handleRemoveItem(item.product.id)}

          />

        ))}

      </div>



      {/* Summary */}

      <div className="lg:col-span-1">

        <CartSummary
          subtotal={subtotal}
          itemCount={itemCount}
          freeShippingThreshold={freeShippingThreshold}
          flatShippingFee={flatShippingFee}
        />

      </div>

    </div>

  )

}
