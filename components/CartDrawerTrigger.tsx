"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import { CartDrawer } from "./CartDrawer"

type CartDrawerTriggerProps = {
  cartCount: number
}

export function CartDrawerTrigger({ cartCount }: CartDrawerTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground"
        aria-label="Open cart"
      >
        <ShoppingBag className="h-5 w-5" />
        <span className="hidden sm:inline">Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {cartCount}
          </span>
        )}
      </button>
      <CartDrawer open={open} cartCount={cartCount} onClose={() => setOpen(false)} />
    </>
  )
}
