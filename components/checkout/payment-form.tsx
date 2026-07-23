"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Lock,
  ArrowLeft,
  Loader2,
  Building2,
  CreditCard,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import type { BankTransferConfig } from "@/lib/config/payment-methods";

export interface OrderPayload {
  items: { productId: string; quantity: number; priceNGN: number }[];
  subtotalNGN: number;
  discountNGN: number;
  shippingNGN: number;
  totalNGN: number;
  couponId?: string | null;
  couponCode?: string | null;
  deliveryMethod: "standard" | "express";
  isGift?: boolean;
  giftMessage?: string;
  giftWrapping?: boolean;
}

interface PaymentFormProps {
  onBack: () => void;
  onComplete: () => void;
  total: number;
  orderPayload: OrderPayload;
  bankTransfer?: BankTransferConfig | null;
  paymentsEnabled?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? (
        <CheckCheck className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function PaymentForm({
  onBack,
  onComplete: _onComplete,
  total,
  orderPayload,
  bankTransfer = null,
  paymentsEnabled = false,
}: PaymentFormProps) {
  const { formData } = useCheckoutStore();
  const checkoutIdempotencyKey = React.useRef(crypto.randomUUID());
  const paymentIdempotencyKey = React.useRef(crypto.randomUUID());
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<
    "CARD" | "BANK_TRANSFER"
  >("CARD");
  const [bankTransferOrder, setBankTransferOrder] = React.useState<{
    orderId: string;
  } | null>(null);

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
      couponCode: orderPayload.couponCode ?? null,
      deliveryMethod: orderPayload.deliveryMethod,
      isGift: orderPayload.isGift,
      giftMessage: orderPayload.giftMessage,
      giftWrapping: orderPayload.giftWrapping,
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
      // 1) Create order (PENDING)
      const createRes = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutIdempotencyKey.current,
        },
        body: JSON.stringify({ ...payload, paymentMethod }),
      });

      const createData = await createRes.json();
      if (!createRes.ok)
        throw new Error(createData.error || "Failed to create order");

      const orderId = createData.orderId as string;
      if (!orderId) throw new Error("No order ID returned");

      if (paymentMethod === "BANK_TRANSFER") {
        // Show bank details instead of redirecting to Paystack
        setBankTransferOrder({ orderId });
        return;
      }

      // 2) Card: Initialize Paystack
      const payRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": paymentIdempotencyKey.current,
        },
        body: JSON.stringify({ orderId }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.authorization_url) {
        paymentIdempotencyKey.current = crypto.randomUUID();
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

  // Bank Transfer Confirmation Screen
  if (bankTransferOrder) {
    return (
      <div className="space-y-6">
        <ClearCartOnSuccess />
        <Card className="border-success/40 bg-success/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please transfer the exact amount below to complete your order.
              Your order will be confirmed once we verify the transfer.
            </p>

            <div className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bank</span>
                  <span className="text-sm font-medium">
                    {bankTransfer?.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Account Name
                  </span>
                  <span className="text-sm font-medium">
                    {bankTransfer?.accountName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Account Number
                  </span>
                  <div className="flex items-center">
                    <span className="font-mono font-bold text-base">
                      {bankTransfer?.accountNumber}
                    </span>
                    <CopyButton text={bankTransfer?.accountNumber || ""} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Use your order ID as the transfer narration:{" "}
              <span className="font-mono text-foreground">
                {bankTransferOrder.orderId.slice(0, 12).toUpperCase()}
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`/account/orders/${bankTransferOrder.orderId}`}>
              View My Order
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 bg-transparent">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-payment-form>
      {/* Payment Method Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Card Payment */}
          <label
            className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
              paymentMethod === "CARD"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80"
              } ${!paymentsEnabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={paymentMethod === "CARD"}
              onChange={() => setPaymentMethod("CARD")}
              disabled={!paymentsEnabled}
              className="h-4 w-4 accent-primary"
            />
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-sm">Card / Online Payment</p>
              <p className="text-xs text-muted-foreground">
                {paymentsEnabled
                  ? "Pay securely via Paystack (card, USSD, bank)"
                  : "Online payment is temporarily disabled for this preview"}
              </p>
            </div>
          </label>

          {/* Bank transfer remains hidden until owner-approved details are configured. */}
          {bankTransfer && <label
            className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
              paymentMethod === "BANK_TRANSFER"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="BANK_TRANSFER"
              checked={paymentMethod === "BANK_TRANSFER"}
              onChange={() => setPaymentMethod("BANK_TRANSFER")}
              className="h-4 w-4 accent-primary"
            />
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-sm">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">
                Transfer directly to our GTBank account. Order confirmed after
                verification.
              </p>
            </div>
          </label>}
        </CardContent>
      </Card>

      {/* Security badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Your order details are encrypted and secured.</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 bg-transparent"
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={
            isProcessing ||
            (paymentMethod === "CARD" && !paymentsEnabled)
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : paymentMethod === "BANK_TRANSFER" ? (
            <>
              <Building2 className="h-4 w-4 mr-2" />
              Place Order: Get Account Details
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay with Paystack
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
