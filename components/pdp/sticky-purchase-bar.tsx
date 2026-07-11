"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/lib/stores/cart-store"
import { toast } from "sonner"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { PdpData } from "@/lib/pdp/types"

/**
 * Compact sticky purchase bar for mobile only. Appears after the hero scrolls out of view. Uses
 * safe-area insets so it never covers system UI, and the page reserves bottom padding so it never
 * hides content.
 */
export function StickyPurchaseBar({ data }: { data: PdpData }) {
  const [visible, setVisible] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const variant = data.variants[0]
  const image = data.media.find((m) => m.kind === "image")?.url ?? ""

  React.useEffect(() => {
    const sentinel = document.getElementById("pdp-hero-sentinel")
    if (!sentinel || typeof IntersectionObserver === "undefined") return
    // Show the bar only once the hero has scrolled UP out of view (sentinel above the viewport top),
    // never while it is still below the fold on first load.
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [])

  const add = async () => {
    if (!variant?.inStock) return
    setAdding(true)
    try {
      await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: data.id, quantity: 1 }),
      })
      addItem(
        { id: data.id, slug: data.slug, name: data.name, brand: data.brand ?? "", price: variant.priceNGN, image },
        1,
        variant.stock ?? undefined,
      )
      await useCartStore.getState().syncFromServer()
      trackPdp("added_to_cart", { productId: data.id, quantity: 1, source: "sticky" })
      toast.success("Added to cart", { description: data.name })
    } catch {
      toast.error("Could not add to cart")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-border bg-background/95 backdrop-blur transition-transform duration-200 lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(variant?.priceNGN ?? data.basePriceNGN)}
            {variant?.size ? ` · ${variant.size}` : ""}
            {" · "}
            {variant?.inStock ? "In stock" : "Out of stock"}
          </p>
        </div>
        <Button onClick={add} disabled={adding || !variant?.inStock} className="h-11 shrink-0 px-6" tabIndex={visible ? 0 : -1}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : variant?.inStock ? "Add" : "Sold out"}
        </Button>
      </div>
    </div>
  )
}
