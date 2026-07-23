"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, GitCompareArrows, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { RatingStars } from "@/components/ui/rating-stars"
import { useWishlistStore } from "@/lib/stores/wishlist-store"
import { useCompareStore, MAX_COMPARE } from "@/lib/stores/compare-store"
import { useCartStore } from "@/lib/stores/cart-store"
import { trackPdp } from "@/lib/analytics/pdp-events"
import { ensureSignedIn } from "@/lib/client-auth"
import type { PdpCard } from "@/lib/pdp/types"

const AVAILABILITY_LABEL: Record<PdpCard["availability"], string> = {
  in_stock: "In stock",
  preorder: "Preorder",
  waitlist: "Waitlist",
  out_of_stock: "Sold out",
}

/**
 * Progressive-disclosure product card: image + essentials always visible; notes/actions revealed on
 * hover/focus (and always available to keyboard + touch). No fabricated data; every field is real
 * or omitted.
 */
export function SmartProductCard({ card, className }: { card: PdpCard; className?: string }) {
  const router = useRouter()
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const inWishlist = useWishlistStore((s) => s.isInWishlist(card.id))
  const toggleCompare = useCompareStore((s) => s.toggle)
  const inCompare = useCompareStore((s) => s.has(card.id))
  const addToCart = useCartStore((s) => s.addItem)

  const canQuickAdd = card.availability === "in_stock"

  const asProduct = {
    id: card.id,
    slug: card.slug,
    name: card.name,
    brand: card.brand ?? "",
    price: card.priceNGN,
    image: card.image ?? "",
    rating: card.ratingAvg,
    reviewCount: card.ratingCount,
    category: "perfumes" as const,
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    const allowed = await ensureSignedIn(`/product/${card.slug}`)
    if (!allowed) return
    toggleWishlist(asProduct)
    trackPdp("wishlist_changed", { productId: card.id, added: !inWishlist })
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    const wasIn = inCompare
    const ok = toggleCompare(card)
    if (!ok) {
      toast.error(`Compare holds up to ${MAX_COMPARE} fragrances`, {
        description: "Remove one to add another.",
      })
      return
    }
    if (wasIn) {
      toast(`Removed ${card.name} from compare`)
      return
    }
    const count = useCompareStore.getState().items.length
    if (count < 2) {
      toast.success("Added to compare", {
        description: "Add one more fragrance to see them side by side.",
      })
    } else {
      toast.success(`Comparing ${count} fragrances`, {
        description: "Ready when you are.",
        action: { label: "View", onClick: () => router.push("/compare") },
      })
    }
    trackPdp("comparison_started", { productId: card.id })
  }

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: card.id, quantity: 1 }),
      })
      addToCart(
        { id: card.id, slug: card.slug, name: card.name, brand: card.brand ?? "", price: card.priceNGN, image: card.image ?? "" },
        1,
      )
      await useCartStore.getState().syncFromServer()
      trackPdp("added_to_cart", { productId: card.id, quantity: 1, source: "card" })
      toast.success("Added to cart", { description: card.name })
    } catch {
      toast.error("Could not add to cart", { description: "Please try again." })
    }
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md",
        className,
      )}
    >
      <Link href={`/product/${card.slug}`} className="relative block aspect-square overflow-hidden bg-secondary/40">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</span>
        )}
        {card.availability !== "in_stock" && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground">
            {AVAILABILITY_LABEL[card.availability]}
          </span>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleWishlist}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current text-accent")} />
          </button>
          <button
            type="button"
            onClick={handleCompare}
            aria-pressed={inCompare}
            aria-label={inCompare ? "Remove from comparison" : "Add to comparison"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm hover:bg-background",
              inCompare ? "text-accent" : "text-foreground",
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {card.brand && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{card.brand}</span>
        )}
        <Link href={`/product/${card.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {card.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {card.concentration && <span>{card.concentration}</span>}
          {card.fragranceFamily && <span className="capitalize">{card.fragranceFamily.toLowerCase()}</span>}
        </div>

        {card.notes.length > 0 && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground/90">{card.notes.slice(0, 4).join(" · ")}</p>
        )}

        {card.ratingCount > 0 && <RatingStars rating={card.ratingAvg} reviewCount={card.ratingCount} size="sm" />}

        {card.reason && <p className="mt-0.5 line-clamp-2 text-[11px] italic text-moss">{card.reason}</p>}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <span className="text-sm font-semibold">{formatPrice(card.priceNGN)}</span>
            {card.hasSample && <span className="ml-1 text-[10px] text-muted-foreground">· sample available</span>}
          </div>
          {canQuickAdd && (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Quick add ${card.name} to cart`}
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Small inline confirmation used by rails to indicate an item is already in compare/wishlist. */
export function InSetBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-accent">
      <Check className="h-3 w-3" /> {label}
    </span>
  )
}
