import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { MainLayout } from "@/components/layout/main-layout";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";

export const runtime = "nodejs";

type PageProps = {
  searchParams: Promise<{
    mock?: string;
    reference?: string;
  }>;
};

async function verifyPaystack(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, message: "PAYSTACK_SECRET_KEY missing", data: null };
  }
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store",
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.status) {
      return {
        ok: false,
        message: data?.message || "Verification failed",
        data: null,
      };
    }
    return { ok: true, message: "Verified", data: data.data };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message || "Verification error",
      data: null,
    };
  }
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isMock = !!params.mock;
  const reference = params.reference?.trim();

  let statusLine = "";
  let amountNGN: number | null = null;

  if (isMock) {
    statusLine = "Mock success (no real charge).";
    // Cart is managed by Zustand store, no need to clear cookie
  } else if (reference) {
    // try to verify with Paystack
    const res = await verifyPaystack(reference);
    if (res.ok && res.data?.status === "success") {
      // amount is in kobo from Paystack; convert to NGN
      amountNGN = Math.round(Number(res.data.amount || 0) / 100);
      statusLine = "Payment verified.";

      // Cart is cleared by Zustand store after successful checkout
      // No need to clear cookie here

      // if you stored orders with a reference, mark it PAID
      const order = await prisma.order.findFirst({ where: { reference } });
      if (order && order.status !== OrderStatus.PAID) {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            totalNGN: order.totalNGN || amountNGN || order.totalNGN,
          },
        });

        // Create notification for admin
        try {
          await prisma.notification.create({
            data: {
              type: "ORDER_PAID",
              title: "New Order Payment",
              message: `Order #${updatedOrder.reference || updatedOrder.id.slice(0, 8)} has been paid. Total: ₦${updatedOrder.totalNGN.toLocaleString()}`,
              orderId: updatedOrder.id,
            },
          });
        } catch {
          // Don't fail if notification creation fails
        }
      }
    } else {
      statusLine = `Payment not verified: ${res.message || "unknown error"}`;
    }
  } else {
    statusLine = "No payment reference provided.";
  }

  const verified = isMock || statusLine === "Payment verified.";

  return (
    <MainLayout>
      <section
        data-surface="day"
        className="min-h-[60vh] bg-background py-16 text-foreground lg:py-24"
      >
        <div className="container mx-auto max-w-xl px-4 sm:px-6">
          {(reference || isMock) && <ClearCartOnSuccess />}

          <div className="border border-border bg-card p-8 text-center sm:p-12">
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                verified
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {verified ? (
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="h-7 w-7" strokeWidth={1.5} />
              )}
            </span>

            <h1 className="mt-6 font-serif text-3xl font-light md:text-4xl">
              {verified ? "Order confirmed" : "Payment status"}
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {isMock
                ? "This was a mock success (no real charge). Add Paystack keys in .env to enable live payments."
                : verified
                  ? "Your payment is verified. A receipt is on its way to your inbox. Your fragrance follows shortly after."
                  : statusLine}
            </p>

            <div className="mt-8 space-y-1.5">
              {reference && (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Reference ·{" "}
                  <span className="text-foreground">{reference}</span>
                </p>
              )}
              {typeof amountNGN === "number" && amountNGN > 0 && (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Amount ·{" "}
                  <span className="text-foreground">
                    {formatPrice(amountNGN)}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/account/orders"
                className="inline-flex h-12 w-full items-center justify-center bg-primary px-7 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                View my orders
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-12 w-full items-center justify-center border border-border px-7 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-accent hover:text-accent sm:w-auto"
              >
                Continue shopping
              </Link>
            </div>
          </div>

          {!isMock && !reference && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Tip: configure your Paystack <code>callback_url</code> to point
              here with a <code>?reference=...</code> so we can auto-verify and
              update your order.
            </p>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
