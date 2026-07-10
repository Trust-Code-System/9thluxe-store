"use client"



import * as React from "react"

import { useRouter } from "next/navigation"

import { ShippingForm } from "./shipping-form"

import { PaymentForm } from "./payment-form"

import { OrderSummary } from "./order-summary"

import { CheckoutSteps } from "./checkout-steps"

import { useCartStore } from "@/lib/stores/cart-store"

import { useCheckoutStore } from "@/lib/stores/checkout-store"

import type { Product } from "@/components/ui/product-card"

import type { OrderPayload } from "./payment-form"



interface OrderItem {

  product: Product

  quantity: number

}



interface CheckoutContentProps {

  items?: OrderItem[]

  freeShippingThreshold?: number

  flatShippingFee?: number

}



export function CheckoutContent({
  items: propItems = [],
  freeShippingThreshold = 500_000,
  flatShippingFee = 15000,
}: CheckoutContentProps) {

  const router = useRouter()

  const cartItems = useCartStore((state) => state.items)

  const [currentStep, setCurrentStep] = React.useState(1)

  const couponCode = useCartStore((state) => state.couponCode)

  const couponId = useCartStore((state) => state.couponId)

  const discount = useCartStore((state) => state.discount)

  const applyCoupon = useCartStore((state) => state.applyCoupon)

  const removeCoupon = useCartStore((state) => state.removeCoupon)

  const { formData } = useCheckoutStore()

  const deliveryMethod = formData.deliveryMethod



  // Use cart store as single source: build display items and order payload from it

  const items = React.useMemo((): OrderItem[] => {

    if (propItems.length > 0) return propItems

    return cartItems.map((cartItem) => ({

      product: {

        id: cartItem.id,

        slug: cartItem.slug,

        name: cartItem.name,

        brand: cartItem.brand,

        price: cartItem.price,

        image: cartItem.image,

        rating: 0,

        reviewCount: 0,

        category: "perfumes",

      },

      quantity: cartItem.quantity,

    }))

  }, [cartItems, propItems])



  const orderPayload: OrderPayload = React.useMemo(() => {

    const subtotalNGN = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

    const baseShippingNGN =
      subtotalNGN >= freeShippingThreshold ? 0 : deliveryMethod === "express" ? 35000 : flatShippingFee

    const giftWrappingNGN = formData.giftWrapping ? 2500 : 0

    const shippingNGN = baseShippingNGN + giftWrappingNGN

    const discountNGN = discount

    const totalNGN = subtotalNGN - discountNGN + shippingNGN

    return {

      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, priceNGN: i.product.price })),

      subtotalNGN: subtotalNGN,

      discountNGN: discountNGN,

      shippingNGN,

      totalNGN,

      couponId: couponId || null,

      isGift: formData.isGift,

      giftMessage: formData.giftMessage || undefined,

      giftWrapping: formData.giftWrapping,

    }

  }, [items, discount, deliveryMethod, couponId, formData.isGift, formData.giftMessage, formData.giftWrapping, freeShippingThreshold, flatShippingFee])



  // Redirect to cart if no items

  React.useEffect(() => {

    if (items.length === 0) {

      router.push("/cart")

    }

  }, [items.length, router])



  if (items.length === 0) {

    return null

  }



  const subtotal = orderPayload.subtotalNGN

  const shipping = orderPayload.shippingNGN

  const currentDiscount = orderPayload.discountNGN

  // Update store discount if it changed

  React.useEffect(() => {

    if (couponCode && currentDiscount !== discount) {

      useCartStore.setState({ discount: currentDiscount })

    }

  }, [currentDiscount, couponCode, discount])

  const total = orderPayload.totalNGN



  return (

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-8">Checkout</h1>



      {/* Steps */}

      <CheckoutSteps currentStep={currentStep} />



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-8">

        {/* Form */}

        <div className="lg:col-span-2">

          {currentStep === 1 && (

            <ShippingForm

              onNext={() => setCurrentStep(2)}

              deliveryMethod={deliveryMethod}

              onDeliveryMethodChange={(method) => {

                useCheckoutStore.getState().updateFormData({ deliveryMethod: method as "standard" | "express" })

              }}

            />

          )}

          {currentStep === 2 && (

            <PaymentForm

              onBack={() => setCurrentStep(1)}

              onComplete={() => setCurrentStep(3)}

              total={total}

              orderPayload={orderPayload}

            />

          )}

        </div>



        {/* Order Summary */}

        <div className="lg:col-span-1">

          <OrderSummary

            items={items}

            subtotal={subtotal}

            shipping={shipping}

            total={total}

            currentStep={currentStep}

            discount={currentDiscount}

            couponCode={couponCode}

            applyCoupon={applyCoupon}

            removeCoupon={removeCoupon}

            onPaymentClick={() => {

              // Trigger form submission in payment form

              const form = document.querySelector('form[data-payment-form]') as HTMLFormElement

              if (form) {

                form.requestSubmit()

              }

            }}

          />

        </div>

      </div>

    </div>

  )

}
