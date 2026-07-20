"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore } from "@/lib/stores/checkout-store";

export interface OrderPayload {
  items: { productId: string; quantity: number; priceNGN: number }[];
  subtotalNGN: number;
  discountNGN: number;
  shippingNGN: number;
  totalNGN: number;
  couponId?: string | null;
  isGift?: boolean;
  giftMessage?: string;
  giftWrapping?: boolean;
}

interface PaymentFormProps {
  onBack: () => void;
  onComplete: () => void;
  total: number;
  orderPayload: OrderPayload;
}

export function PaymentForm({
  onBack,
  onComplete: _onComplete,
  total,
  orderPayload,
}: PaymentFormProps) {
  const { formData } = useCheckoutStore();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const buildPayload = () => {
    const addressLine1 =
      [formData.address, formData.address2].filter(Boolean).join(", ").trim() ||
      formData.address;
    return {
      addressLine1,
      city: formData.city,
      state: formData.state,
      phone: formData.phone,
      items: orderPayload.items,
      subtotalNGN: orderPayload.subtotalNGN,
      discountNGN: orderPayload.discountNGN,
      shippingNGN: orderPayload.shippingNGN,
      totalNGN: orderPayload.totalNGN,
      couponId: orderPayload.couponId ?? null,
      isGift: orderPayload.isGift,
      giftMessage: orderPayload.giftMessage,
      giftWrapping: orderPayload.giftWrapping,
      paymentMethod: "CARD" as const,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error("Email required", {
        description:
          "Please provide your email address in the shipping information.",
      });
      return;
    }

    const payload = buildPayload();
    if (
      !payload.addressLine1 ||
      !payload.city ||
      !payload.state ||
      !payload.phone
    ) {
      toast.error("Shipping required", {
        description: "Please complete shipping address and phone.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const createData = await createRes.json();
      if (!createRes.ok)
        throw new Error(createData.error || "Failed to create order");

      const orderId = createData.orderId as string;
      if (!orderId) throw new Error("No order ID returned");

      const payRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          amountNGN: total,
          metadata: {
            orderId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          },
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.authorization_url) {
        throw new Error(payData.error || "Failed to initialize payment");
      }

      window.location.href = payData.authorization_url;
    } catch (error: unknown) {
      setIsProcessing(false);
      const message =
        error instanceof Error ? error.message : "Please try again later.";
      toast.error("Payment initialization failed", { description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-payment-form>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 rounded-xl border border-primary bg-primary/5 p-4">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Pay with Paystack</p>
              <p className="text-xs text-muted-foreground">
                Card, bank transfer, and USSD, all handled securely on
                Paystack&apos;s checkout.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Your payment is encrypted and processed by Paystack.</span>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 bg-transparent"
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay with Paystack
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
