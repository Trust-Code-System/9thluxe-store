"use client"



import * as React from "react"

import Link from "next/link"

import { Tag, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Separator } from "@/components/ui/separator"

import { useCartStore } from "@/lib/stores/cart-store"

import { toast } from "sonner"



interface CartSummaryProps {

  subtotal: number

  itemCount: number

  /** Commerce policy from backend config (lib/config/commerce). */
  freeShippingThreshold?: number

  flatShippingFee?: number

}



export function CartSummary({
  subtotal,
  itemCount,
  freeShippingThreshold = 500000,
  flatShippingFee = 15000,
}: CartSummaryProps) {

  const couponCode = useCartStore((state) => state.couponCode)

  const discount = useCartStore((state) => state.discount)

  const applyCoupon = useCartStore((state) => state.applyCoupon)

  const removeCoupon = useCartStore((state) => state.removeCoupon)

  const [inputCode, setInputCode] = React.useState("")

  const [couponMessage, setCouponMessage] = React.useState<string | null>(null)



  const formatPrice = (amount: number) => {

    return new Intl.NumberFormat("en-NG", {

      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    }).format(amount)

  }



  const shipping = subtotal >= freeShippingThreshold ? 0 : flatShippingFee

  const currentDiscount = discount

  const total = subtotal - currentDiscount + shipping

  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false)

  const handleApplyCoupon = async (e?: React.FormEvent) => {

    e?.preventDefault()

    const code = inputCode.trim()

    if (!code) {

      setCouponMessage("Please enter a coupon code")

      return

    }

    setIsApplyingCoupon(true)

    const success = await applyCoupon(code, subtotal)

    setIsApplyingCoupon(false)

    if (success) {

      setCouponMessage("Coupon applied!")

      setInputCode("")

      toast.success("Coupon applied")

    } else {

      setCouponMessage("Invalid or expired coupon code.")

      toast.error("Invalid coupon code")

    }

  }



  const handleRemoveCoupon = () => {

    removeCoupon()

    setCouponMessage(null)

    setInputCode("")

    toast.success("Coupon removed")

  }



  return (

    <Card className="p-6 sticky top-24">

      <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>



      <div className="space-y-4">

        {/* Subtotal */}

        <div className="flex justify-between text-sm">

          <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>

          <span>{formatPrice(subtotal)}</span>

        </div>



        {/* Shipping */}

        <div className="flex justify-between text-sm">

          <span className="text-muted-foreground">Shipping</span>

          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>

        </div>



        {/* Discount */}

        {discount > 0 && couponCode && (

          <div className="flex justify-between text-sm text-primary">

            <div className="flex items-center gap-2">

              <span>Discount ({couponCode})</span>

              <button

                onClick={handleRemoveCoupon}

                className="text-xs text-muted-foreground hover:text-foreground underline"

                type="button"

              >

                Remove

              </button>

            </div>

            <span>-{formatPrice(discount)}</span>

          </div>

        )}



        {/* Coupon */}

        <div className="pt-2">

          {!couponCode ? (

            <form onSubmit={handleApplyCoupon} className="space-y-2">

              <div className="flex gap-2">

                <div className="relative flex-1">

                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  <Input

                    type="text"

                    placeholder="Coupon code"

                    value={inputCode}

                    onChange={(e) => {

                      setInputCode(e.target.value)

                      setCouponMessage(null)

                    }}

                    className="pl-9"

                  />

                </div>

                <Button type="submit" variant="outline" className="bg-transparent" disabled={isApplyingCoupon}>

                  {isApplyingCoupon ? "..." : "Apply"}

                </Button>

              </div>

              {couponMessage && (

                <p

                  className={`text-xs mt-2 ${

                    couponMessage.includes("applied") || couponMessage.includes("saved")

                      ? "text-primary"

                      : "text-destructive"

                  }`}

                >

                  {couponMessage}

                </p>

              )}

              {!couponMessage && <p className="text-xs text-muted-foreground mt-2">Enter a valid discount code</p>}

            </form>

          ) : (

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-medium text-primary">Coupon Applied: {couponCode}</p>

                  <p className="text-xs text-muted-foreground">You saved {formatPrice(discount)}</p>

                </div>

                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 text-xs">

                  Remove

                </Button>

              </div>

            </div>

          )}

        </div>



        <Separator className="my-4" />



        {/* Total */}

        <div className="flex justify-between">

          <span className="font-semibold">Total</span>

          <span className="font-semibold text-lg">{formatPrice(total)}</span>

        </div>



        {/* Free Shipping Progress Bar */}

        <div className="space-y-1.5 pt-1">

          <div className="flex justify-between text-xs">

            <span className={shipping === 0 ? "font-medium text-accent" : "text-muted-foreground"}>

              {shipping === 0

                ? "Complimentary delivery unlocked"

                : `Add ${formatPrice(Math.max(0, freeShippingThreshold - subtotal))} for free delivery`}

            </span>

            <span className="text-muted-foreground">{Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%</span>

          </div>

          <progress

            className="w-full h-1.5 rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-accent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-accent"

            value={Math.min(100, (subtotal / freeShippingThreshold) * 100)}

            max={100}

          />

        </div>

      </div>



      {/* Checkout Button */}

      <Button asChild className="w-full mt-6 h-12 text-base">

        <Link href="/checkout">Proceed to Checkout</Link>

      </Button>



      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">

        <Lock className="h-3 w-3 text-accent" />

        Secure checkout · payment verified server-side

      </p>



      {/* Continue Shopping */}

      <Button asChild variant="ghost" className="w-full mt-2">

        <Link href="/shop">Continue Shopping</Link>

      </Button>

    </Card>

  )

}
