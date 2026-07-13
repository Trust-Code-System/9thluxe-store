"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ShippingForm } from "./shipping-form";

import { PaymentForm } from "./payment-form";

import { OrderSummary } from "./order-summary";

import { CheckoutSteps } from "./checkout-steps";

import { useCartStore } from "@/lib/stores/cart-store";

import { useCheckoutStore } from "@/lib/stores/checkout-store";

import type { Product } from "@/components/ui/product-card";

import type { OrderPayload } from "./payment-form";

interface OrderItem {
  product: Product;

  quantity: number;
}

interface CheckoutContentProps {
  items?: OrderItem[];

  freeShippingThreshold?: number;

  flatShippingFee?: number;
}

export function CheckoutContent({
  items: propItems = [],
  freeShippingThreshold = 500_000,
  flatShippingFee = 15000,
}: CheckoutContentProps) {
  const router = useRouter();

  const cartItems = useCartStore((state) => state.items);

  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const [currentStep, setCurrentStep] = React.useState(1);

  const couponCode = useCartStore((state) => state.couponCode);

  const couponId = useCartStore((state) => state.couponId);

  const discount = useCartStore((state) => state.discount);

  const applyCoupon = useCartStore((state) => state.applyCoupon);

  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const { formData } = useCheckoutStore();

  const deliveryMethod = formData.deliveryMethod;

  // Use cart store as single source: build display items and order payload from it

  const items = React.useMemo((): OrderItem[] => {
    if (propItems.length > 0) return propItems;

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
    }));
  }, [cartItems, propItems]);

  const orderPayload: OrderPayload = React.useMemo(() => {
    const subtotalNGN = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0,
    );

    const baseShippingNGN =
      subtotalNGN >= freeShippingThreshold
        ? 0
        : deliveryMethod === "express"
          ? 35000
          : flatShippingFee;

    const giftWrappingNGN = formData.giftWrapping ? 2500 : 0;

    const shippingNGN = baseShippingNGN + giftWrappingNGN;

    const discountNGN = discount;

    const totalNGN = subtotalNGN - discountNGN + shippingNGN;

    return {
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        priceNGN: i.product.price,
      })),

      subtotalNGN: subtotalNGN,

      discountNGN: discountNGN,

      shippingNGN,

      totalNGN,

      couponId: couponId || null,

      isGift: formData.isGift,

      giftMessage: formData.giftMessage || undefined,

      giftWrapping: formData.giftWrapping,
    };
  }, [
    items,
    discount,
    deliveryMethod,
    couponId,
    formData.isGift,
    formData.giftMessage,
    formData.giftWrapping,
    freeShippingThreshold,
    flatShippingFee,
  ]);

  // Redirect to cart only once the server cart has hydrated and is truly empty.

  React.useEffect(() => {
    if (hasHydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hasHydrated, items.length, router]);

  const subtotal = orderPayload.subtotalNGN;

  const shipping = orderPayload.shippingNGN;

  const currentDiscount = orderPayload.discountNGN;

  // Update store discount if it changed (hook must run unconditionally, before any early return)

  React.useEffect(() => {
    if (couponCode && currentDiscount !== discount) {
      useCartStore.setState({ discount: currentDiscount });
    }
  }, [currentDiscount, couponCode, discount]);

  const total = orderPayload.totalNGN;

  if (!hasHydrated || items.length === 0) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center bg-background px-4 py-16 text-center text-foreground"
        aria-live="polite"
        aria-busy={!hasHydrated}
      >
        <div className="max-w-sm">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-3 font-serif text-3xl font-light">
            {hasHydrated ? "Your bag is empty" : "Preparing checkout"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {hasHydrated
              ? "Returning you to your bag."
              : "Loading your selected fragrances."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10">
          <span className="eyebrow">Almost yours</span>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.01em] md:text-5xl">
            Checkout
          </h1>
        </div>

        {/* Steps */}

        <CheckoutSteps currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-8">
          {/* Form */}

          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <ShippingForm
                onNext={() => setCurrentStep(2)}
                standardDeliveryFee={flatShippingFee}
                freeShippingThreshold={freeShippingThreshold}
                deliveryMethod={deliveryMethod}
                onDeliveryMethodChange={(method) => {
                  useCheckoutStore
                    .getState()
                    .updateFormData({
                      deliveryMethod: method as "standard" | "express",
                    });
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

                const form = document.querySelector(
                  "form[data-payment-form]",
                ) as HTMLFormElement;

                if (form) {
                  form.requestSubmit();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
