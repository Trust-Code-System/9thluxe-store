"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { useCartStore } from "@/lib/stores/cart-store"
import { toast } from "sonner"
import type { Product } from "@/components/ui/product-card"

interface StickyProductBarProps {
  product: Product & {
    inStock: boolean
    stockCount: number
  }
}

export function StickyProductBar({ product }: StickyProductBarProps) {
  const [quantity, setQuantity] = React.useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const handleAddToCart = async () => {
    if (!product.inStock) {
      toast.error("Out of stock", {
        description: "This product is currently out of stock.",
      })
      return
    }
    if (quantity > product.stockCount) {
      toast.error("Insufficient stock", {
        description: `Only ${product.stockCount} unit${product.stockCount !== 1 ? "s" : ""} available.`,
      })
      return
    }
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, quantity }),
      })
      if (!res.ok) throw new Error("Failed to add")
      addItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.image,
        },
        quantity,
        product.stockCount,
      )
      await useCartStore.getState().syncFromServer()
      toast.success("Added to cart", {
        description: `${quantity} × ${product.name} added to your cart.`,
      })
    } catch {
      toast.error("Could not add to cart", { description: "Please try again." })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="container mx-auto flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
        </div>
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={product.stockCount}
          className="shrink-0"
        />
        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="h-11 shrink-0 px-5"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  )
}
