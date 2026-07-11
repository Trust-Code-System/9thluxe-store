"use client"

import * as React from "react"

import Image from "next/image"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Separator } from "@/components/ui/separator"

import { Input } from "@/components/ui/input"

import { Button } from "@/components/ui/button"

import { Tag, Lock, Shield, RotateCcw, Gift } from "lucide-react"

import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"

import { Textarea } from "@/components/ui/textarea"

import { useCheckoutStore } from "@/lib/stores/checkout-store"

import type { Product } from "@/components/ui/product-card"



interface OrderItem {

  product: Product

  quantity: number

}



interface OrderSummaryProps {

  items: OrderItem[]

  subtotal: number

  shipping: number

  total: number

  currentStep?: number

  onPaymentClick?: () => void

  discount?: number

  couponCode?: string | null

  applyCoupon?: (code: string, subtotal: number) => Promise<boolean>

  removeCoupon?: () => void

}



export function OrderSummary({

  items,

  subtotal,

  shipping,

  total,

  currentStep,

  onPaymentClick,

  discount = 0,

  couponCode: propCouponCode = null,

  applyCoupon: propApplyCoupon,

  removeCoupon: propRemoveCoupon,

}: OrderSummaryProps) {

  const [inputCode, setInputCode] = React.useState("")

  const [couponMessage, setCouponMessage] = React.useState<string | null>(null)

  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false)

  const appliedCoupon = propCouponCode

  const { formData, updateFormData } = useCheckoutStore()



  const formatPrice = (amount: number) => {

    return new Intl.NumberFormat("en-NG", {

      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    }).format(amount)

  }



  const handleApplyCoupon = async (e?: React.FormEvent) => {

    e?.preventDefault()

    const code = inputCode.trim()

    if (!code) {

      setCouponMessage("Please enter a coupon code")

      return

    }

    if (propApplyCoupon) {

      setIsApplyingCoupon(true)

      const success = await propApplyCoupon(code, subtotal)

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

  }



  const handleRemoveCoupon = () => {

    propRemoveCoupon?.()

    setCouponMessage(null)

    setInputCode("")

    toast.success("Coupon removed")

  }



  return (

    <Card className="sticky top-24">

      <CardHeader>

        <CardTitle className="text-lg">Order Summary</CardTitle>

      </CardHeader>

      <CardContent className="space-y-4">

        {/* Items */}

        <div className="space-y-4">

          {items.map((item) => (

            <div key={item.product.id} className="flex gap-3">

              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">

                <Image

                  src={item.product.image || "/placeholder-flacon.svg"}

                  alt={item.product.name}

                  fill

                  className="object-cover"

                  sizes="64px"

                />

                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">

                  {item.quantity}

                </span>

              </div>

              <div className="flex-1 min-w-0">

                <p className="text-xs text-muted-foreground">{item.product.brand}</p>

                <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>

                <p className="text-sm">{formatPrice(item.product.price * item.quantity)}</p>

              </div>

            </div>

          ))}

        </div>



        {/* Gift Options */}

        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">

          <p className="text-sm font-medium flex items-center gap-2">

            <Gift className="h-4 w-4 text-primary" />

            Gift Options

          </p>

          <label className="flex items-start gap-3 cursor-pointer">

            <Checkbox

              id="isGift"

              checked={formData.isGift}

              onCheckedChange={(checked) => updateFormData({ isGift: !!checked })}

              className="mt-0.5"

            />

            <div>

              <span className="text-sm font-medium">This is a gift</span>

              <p className="text-xs text-muted-foreground">Add a personal message to your order</p>

            </div>

          </label>

          {formData.isGift && (

            <Textarea

              placeholder="Write your gift message here..."

              value={formData.giftMessage}

              onChange={(e) => updateFormData({ giftMessage: e.target.value })}

              rows={2}

              className="text-sm"

            />

          )}

          <label className="flex items-start gap-3 cursor-pointer">

            <Checkbox

              id="giftWrapping"

              checked={formData.giftWrapping}

              onCheckedChange={(checked) => updateFormData({ giftWrapping: !!checked })}

              className="mt-0.5"

            />

            <div>

              <span className="text-sm font-medium">Luxury gift wrapping</span>

              <p className="text-xs text-muted-foreground">Premium gold ribbon packaging +₦2,500</p>

            </div>

          </label>

        </div>



        <Separator />



        {/* Discount Display */}

        {discount > 0 && appliedCoupon && (

          <div className="flex justify-between text-sm text-primary">

            <div className="flex items-center gap-2">

              <span>Discount ({appliedCoupon})</span>

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



        {/* Coupon Input */}

        {!appliedCoupon && (

          <form onSubmit={handleApplyCoupon} className="space-y-2">

            <div className="flex gap-2">

              <div className="relative flex-1">

                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input

                  type="text"

                  placeholder="Discount code"

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

                className={`text-xs ${

                  couponMessage.includes("applied") || couponMessage.includes("saved")

                    ? "text-primary"

                    : "text-destructive"

                }`}

              >

                {couponMessage}

              </p>

            )}

            {!couponMessage && <p className="text-xs text-muted-foreground">Enter a valid discount code</p>}

          </form>

        )}



        <Separator />



        {/* Totals */}

        <div className="space-y-2">

          <div className="flex justify-between text-sm">

            <span className="text-muted-foreground">Subtotal</span>

            <span>{formatPrice(subtotal)}</span>

          </div>

          {discount > 0 && (

            <div className="flex justify-between text-sm text-primary">

              <span>Discount</span>

              <span>-{formatPrice(discount)}</span>

            </div>

          )}

          <div className="flex justify-between text-sm">

            <span className="text-muted-foreground">Shipping</span>

            <span>{shipping === 0 ? "Free" : formatPrice(formData.giftWrapping ? shipping - 2500 : shipping)}</span>

          </div>

          {formData.giftWrapping && (

            <div className="flex justify-between text-sm text-primary">

              <span className="flex items-center gap-1.5">

                <Gift className="h-3.5 w-3.5" />

                Gift wrapping

              </span>

              <span>+{formatPrice(2500)}</span>

            </div>

          )}

          <Separator className="my-2" />

          <div className="flex justify-between">

            <span className="font-semibold">Total</span>

            <span className="font-semibold text-lg">{formatPrice(total)}</span>

          </div>

        </div>



        {/* Payment Button - Show on payment step or as placeholder */}

        {currentStep === 2 ? (

          <div className="pt-4 space-y-3">

            <Button className="w-full h-12 text-base" onClick={onPaymentClick} type="button">

              <Lock className="h-4 w-4 mr-2" />

              Pay with Paystack

            </Button>

            <p className="text-xs text-center text-muted-foreground">

              Your payment information is secure and encrypted.

            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-muted-foreground">

              <span className="flex items-center gap-1.5 text-xs">

                <Shield className="h-3.5 w-3.5" />

                SSL Secured

              </span>

              <span className="text-xs">Paystack</span>

              <span className="flex items-center gap-1.5 text-xs">

                <RotateCcw className="h-3.5 w-3.5" />

                7-day returns

              </span>

            </div>

          </div>

        ) : currentStep === 1 ? (

          <div className="pt-4">

            <Button className="w-full h-12 text-base" disabled>

              <Lock className="h-4 w-4 mr-2" />

              Pay with Paystack

            </Button>

            <p className="text-xs text-center text-muted-foreground mt-3">

              Complete shipping information to proceed.

            </p>

          </div>

        ) : null}

      </CardContent>

    </Card>

  )

}
