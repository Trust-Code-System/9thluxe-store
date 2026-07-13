"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Loader2,
  Check,
  Bell,
  Gift,
  Droplet,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RatingStars } from "@/components/ui/rating-stars"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/lib/stores/cart-store"
import { useWishlistStore } from "@/lib/stores/wishlist-store"
import { useCompareStore, MAX_COMPARE } from "@/lib/stores/compare-store"
import { trackPdp } from "@/lib/analytics/pdp-events"
import { ensureSignedIn } from "@/lib/client-auth"
import type { PdpData, PdpVariant, PdpCard } from "@/lib/pdp/types"

interface PurchasePanelProps {
  data: PdpData
  policyShipping: string
  policyReturns: string
}

function StockPill({ variant, state }: { variant: PdpVariant; state: PdpData["stockState"] }) {
  if (!variant.inStock && state === "preorder")
    return <Pill tone="amber">Preorder: ships when back in stock</Pill>
  if (!variant.inStock && state === "waitlist") return <Pill tone="amber">Join the waitlist</Pill>
  if (!variant.inStock) return <Pill tone="destructive">Out of stock</Pill>
  if (variant.stock != null && variant.stock <= 5)
    return <Pill tone="amber">{variant.stock === 1 ? "Last one, order soon" : `Only ${variant.stock} left`}</Pill>
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-moss">
      <Check className="h-4 w-4" /> In stock
    </span>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "amber" | "destructive" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        tone === "amber"
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </span>
  )
}

export function PurchasePanel({ data, policyShipping, policyReturns }: PurchasePanelProps) {
  const router = useRouter()
  const [variantId, setVariantId] = React.useState(data.variants[0]?.id ?? "")
  const [quantity, setQuantity] = React.useState(1)
  const [adding, setAdding] = React.useState(false)
  const [waitlistEmail, setWaitlistEmail] = React.useState("")
  const [waitlisted, setWaitlisted] = React.useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const inWishlist = useWishlistStore((s) => s.isInWishlist(data.id))
  const toggleCompare = useCompareStore((s) => s.toggle)
  const inCompare = useCompareStore((s) => s.has(data.id))

  const variant = data.variants.find((v) => v.id === variantId) ?? data.variants[0]

  React.useEffect(() => {
    trackPdp("product_viewed", { productId: data.id, slug: data.slug })
  }, [data.id, data.slug])

  const selectVariant = (v: PdpVariant) => {
    setVariantId(v.id)
    setQuantity(1)
    trackPdp(v.isSample ? "sample_selected" : "size_selected", { productId: data.id, variantId: v.id })
  }

  const image = data.media.find((m) => m.kind === "image")?.url ?? ""

  const addToCart = async (buyNow: boolean) => {
    if (!variant?.inStock) return
    setAdding(true)
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: data.id, quantity, variantId: variant.id.includes(":base") ? undefined : variant.id }),
      })
      if (!res.ok) throw new Error("add failed")
      addItem(
        { id: data.id, slug: data.slug, name: data.name, brand: data.brand ?? "", price: variant.priceNGN, image },
        quantity,
        variant.stock ?? undefined,
      )
      await useCartStore.getState().syncFromServer()
      trackPdp(buyNow ? "buy_now_selected" : "added_to_cart", {
        productId: data.id,
        variantId: variant.id,
        quantity,
      })
      if (buyNow) {
        router.push("/checkout")
      } else {
        toast.success("Added to cart", { description: `${quantity} × ${data.name}` })
      }
    } catch {
      toast.error("Could not add to cart", { description: "Please try again." })
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async () => {
    const allowed = await ensureSignedIn(`/product/${data.slug}`)
    if (!allowed) return
    toggleWishlist({
      id: data.id,
      slug: data.slug,
      name: data.name,
      brand: data.brand ?? "",
      price: data.basePriceNGN,
      image,
      rating: data.ratingAvg,
      reviewCount: data.ratingCount,
      category: "perfumes",
    })
    trackPdp("wishlist_changed", { productId: data.id, added: !inWishlist })
  }

  const handleCompare = () => {
    const card: PdpCard = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      brand: data.brand,
      concentration: data.concentration,
      priceNGN: data.basePriceNGN,
      compareAtNGN: data.baseCompareAtNGN,
      image: image || null,
      ratingAvg: data.ratingAvg,
      ratingCount: data.ratingCount,
      fragranceFamily: data.fragranceFamily,
      notes: [...data.notesTop, ...data.notesHeart].slice(0, 4).map((n) => n.name),
      hasSample: data.hasSample,
      availability: data.stock > 0 ? "in_stock" : "out_of_stock",
    }
    const ok = toggleCompare(card)
    if (!ok) toast.error(`Compare holds up to ${MAX_COMPARE} fragrances`)
    else trackPdp("comparison_started", { productId: data.id })
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share) await navigator.share({ title: data.name, text: `${data.name} on Fàdè`, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success("Link copied")
      }
    } catch {
      /* user dismissed share sheet */
    }
  }

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/v1/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: data.id, email: waitlistEmail }),
      })
      if (!res.ok) throw new Error()
      setWaitlisted(true)
      toast.success("We'll email you when it's back")
    } catch {
      toast.error("Could not join waitlist", { description: "Please try again." })
    }
  }

  const fullBottles = data.variants.filter((v) => !v.isSample)
  const samples = data.variants.filter((v) => v.isSample)
  const showVariantChoice = data.variants.length > 1

  return (
    <div className="flex flex-col gap-5">
      {data.brand && (
        <Link
          href={`/shop?brand=${encodeURIComponent(data.brand)}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-accent hover:text-accent/80"
        >
          {data.brand}
        </Link>
      )}
      <div className="-mt-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{data.name}</h1>
        {data.concentration && <p className="mt-1 text-sm text-muted-foreground">{data.concentration}</p>}
      </div>

      {data.olfactoryDesc && <p className="leading-relaxed text-muted-foreground">{data.olfactoryDesc}</p>}

      {data.ratingCount > 0 ? (
        <Link href="#reviews" className="w-fit">
          <RatingStars rating={data.ratingAvg} reviewCount={data.ratingCount} size="md" />
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">No reviews yet</span>
      )}

      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatPrice(variant?.priceNGN ?? data.basePriceNGN)}</span>
        {variant?.compareAtNGN && variant.compareAtNGN > variant.priceNGN && (
          <span className="text-lg text-muted-foreground line-through">{formatPrice(variant.compareAtNGN)}</span>
        )}
        {variant?.pricePerMl && (
          <span className="text-xs text-muted-foreground">≈ {formatPrice(variant.pricePerMl)}/ml</span>
        )}
      </div>

      {variant && <StockPill variant={variant} state={data.stockState} />}

      {/* Sample-first / variant choice */}
      {showVariantChoice && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Choose your format
          </legend>
          <div className="flex flex-wrap gap-2">
            {[...fullBottles, ...samples].map((v) => {
              const selected = v.id === variantId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVariant(v)}
                  aria-pressed={selected}
                  disabled={!v.inStock}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    selected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-1 font-medium">
                    {v.isSample && <Droplet className="h-3.5 w-3.5 text-accent" />}
                    {v.isSample ? "Sample" : "Full bottle"}
                    {v.size ? ` · ${v.size}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatPrice(v.priceNGN)}</span>
                </button>
              )
            })}
          </div>
          {samples.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Try the sample first. Where eligible, its value can be redeemed against the full bottle.{" "}
              <Link href="/help#samples" className="underline">
                How sample credit works
              </Link>
            </p>
          )}
        </fieldset>
      )}

      {/* Quantity + primary CTAs OR waitlist */}
      {variant?.inStock ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <QuantitySelector value={quantity} onChange={setQuantity} max={variant.stock ?? 99} />
            <Button onClick={() => addToCart(false)} disabled={adding} className="h-12 flex-1 text-base">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
            </Button>
          </div>
          <Button
            onClick={() => addToCart(true)}
            disabled={adding}
            variant="outline"
            className="h-12 w-full bg-transparent text-base"
          >
            Buy now
          </Button>
        </div>
      ) : data.stockState === "preorder" || data.stockState === "waitlist" ? (
        waitlisted ? (
          <p className="flex items-center gap-2 rounded-lg border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
            <Check className="h-4 w-4" /> You&apos;re on the list. We&apos;ll email you.
          </p>
        ) : (
          <form onSubmit={submitWaitlist} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="waitlist-email" className="sr-only">
              Email for back-in-stock alert
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" className="h-11">
              <Bell className="mr-1.5 h-4 w-4" /> Notify me
            </Button>
          </form>
        )
      ) : (
        <Button disabled className="h-12 w-full">
          Out of stock
        </Button>
      )}

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={handleWishlist} aria-pressed={inWishlist}>
          <Heart className={cn("mr-2 h-4 w-4", inWishlist && "fill-current text-accent")} />
          {inWishlist ? "Saved" : "Wishlist"}
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCompare} aria-pressed={inCompare}>
          {inCompare ? "In compare" : "Compare"}
        </Button>
        <Button variant="outline" size="icon" className="bg-transparent" onClick={handleShare} aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Gift options, honest: opens gift concierge flow */}
      <Link
        href={`/concierge?gift=${data.slug}`}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Gift className="h-4 w-4 text-accent" /> Add gift wrapping &amp; a message at checkout
      </Link>

      {/* Trust / delivery / returns: single policy source */}
      <div className="mt-1 grid grid-cols-1 gap-3 rounded-xl border border-border bg-secondary/50 p-4 sm:grid-cols-3">
        <TrustItem icon={<ShieldCheck className="h-4 w-4 text-accent" />} title="Inspected & sealed">
          <Link href="#authenticity" className="underline-offset-2 hover:underline">
            Authenticity
          </Link>
        </TrustItem>
        <TrustItem icon={<Truck className="h-4 w-4 text-accent" />} title="Nationwide delivery">
          {policyShipping}
        </TrustItem>
        <TrustItem icon={<RotateCcw className="h-4 w-4 text-accent" />} title="Returns">
          {policyReturns}
        </TrustItem>
      </div>
    </div>
  )
}

function TrustItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="text-xs leading-snug">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}
