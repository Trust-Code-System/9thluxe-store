"use client"

import { useEffect, useState } from "react"
import { X, Trash2 } from "lucide-react"
import Link from "next/link"

type CartItem = {
  productId: string
  slug: string
  name: string
  brand?: string | null
  image: string
  quantity: number
  priceNGN: number
  lineTotal: number
}

type CartDrawerProps = {
  open: boolean
  cartCount: number
  onClose: () => void
}

export function CartDrawer({ open, cartCount, onClose }: CartDrawerProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState("")
  const [discount, setDiscount] = useState(0)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)

  const fetchSummary = async () => {
    if (!open) return
    setLoading(true)
    try {
      const res = await fetch("/api/cart/summary", { cache: "no-store" })
      const data = await res.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [open, cartCount])

  const handleQuantity = async (productId: string, quantity: number) => {
    await fetch("/api/cart/update", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    })
    fetchSummary()
  }

  const handleCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coupon) return
    const res = await fetch("/api/coupons/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, subtotalNGN: total }),
    })
    const data = await res.json()
    if (data?.ok) {
      setDiscount(data.discountNGN ?? 0)
      setCouponMessage(`Coupon applied – ₦${data.discountNGN.toLocaleString()} off`)
    } else {
      setCouponMessage(data?.message || "Invalid coupon")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close cart drawer"
      />
      <aside className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-background shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your bag</p>
            <p className="text-lg font-semibold">{cartCount} item(s)</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 divide-y divide-border overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading cart…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Your cart is empty.</div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 px-4 py-4">
                <img src={item.image} alt={item.name} className="h-16 w-16 overflow-hidden rounded-2xl object-cover" />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>{item.name}</span>
                    <button
                      onClick={() => handleQuantity(item.productId, 0)}
                      className="text-destructive hover:text-destructive/80"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.brand}</span>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.productId, Math.max(1, item.quantity - 1))}
                      className="rounded-full border px-3 py-1 text-muted-foreground"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                      className="rounded-full border px-3 py-1 text-muted-foreground"
                    >
                      +
                    </button>
                    <span className="ml-auto font-semibold text-foreground">
                      ₦{item.lineTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-4 border-t border-border px-4 py-5">
          <form onSubmit={handleCoupon} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Apply coupon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="input flex-1"
                placeholder="Code"
              />
              <button type="submit" className="btn">
                Apply
              </button>
            </div>
            {couponMessage && <p className="text-xs text-foreground">{couponMessage}</p>}
          </form>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-foreground">
              <span>Discount</span>
              <span>- ₦{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-lg font-semibold text-foreground">
            <span>Total</span>
            <span>₦{Math.max(total - discount, 0).toLocaleString()}</span>
          </div>
          <Link href="/checkout" className="btn block text-center">
            Go to checkout
          </Link>
        </div>
      </aside>
    </div>
  )
}
