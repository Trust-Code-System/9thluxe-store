import { NextRequest, NextResponse } from "next/server"

import { getPayments } from "@/integrations/registry"
import { resolveLoyaltyTier } from "@/lib/config/commerce"
import { pointsForOrder } from "@/lib/loyalty/points"
import { reversePointsForOrder } from "@/lib/loyalty/service"
import { enqueueOrderPaidEvents } from "@/lib/jobs/outbox"
import { logger } from "@/lib/observability/logger"
import { matchesExpectedPayment } from "@/lib/payments/match"
import { prisma } from "@/lib/prisma"
import { recordWebhookOnce } from "@/lib/webhooks/idempotency"
import { finalizeInventoryForOrder } from "@/lib/inventory/reservations"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get("x-paystack-signature")
  const provider = getPayments()

  if (provider.name !== "paystack") {
    return NextResponse.json({ error: "payment_provider_unavailable" }, { status: 503 })
  }

  const verified = provider.verifyWebhook(raw, signature)
  if (!verified.valid) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
  }

  let rawEvent: any
  try {
    rawEvent = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const eventId = String(
    rawEvent?.id ??
      rawEvent?.data?.id ??
      verified.reference ??
      verified.orderId ??
      "",
  )

  if (verified.event === "charge.success") {
    const { orderId, reference, amountNGN, currency, status } = verified
    if (!orderId || !reference || amountNGN == null || !currency) {
      logger.warn("paystack_webhook_incomplete", { eventId })
      return NextResponse.json({ ok: true, ignored: "incomplete" })
    }

    const attempt = await prisma.paymentAttempt.findUnique({
      where: { providerReference: reference },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            reference: true,
            totalNGN: true,
            paymentMethod: true,
            couponId: true,
            items: { select: { productId: true, quantity: true } },
          },
        },
      },
    })

    if (!attempt || attempt.orderId !== orderId) {
      logger.warn("paystack_webhook_unknown_attempt", { eventId, reference, orderId })
      return NextResponse.json({ ok: true, ignored: "unknown_attempt" })
    }

    const matches = matchesExpectedPayment({
      expectedReference: attempt.providerReference,
      receivedReference: reference,
      expectedAmountNGN: attempt.expectedAmountNGN,
      receivedAmountNGN: amountNGN,
      expectedCurrency: attempt.expectedCurrency,
      receivedCurrency: currency,
      providerStatus: status,
      paymentMethod: attempt.order.paymentMethod,
    })

    if (
      !matches ||
      attempt.expectedAmountNGN !== attempt.order.totalNGN ||
      attempt.status === "FAILED" ||
      attempt.status === "ABANDONED"
    ) {
      logger.error("paystack_webhook_payment_mismatch", {
        eventId,
        reference,
        orderId,
        attemptStatus: attempt.status,
        expectedAmountNGN: attempt.expectedAmountNGN,
        orderAmountNGN: attempt.order.totalNGN,
        receivedAmountNGN: amountNGN,
        expectedCurrency: attempt.expectedCurrency,
        receivedCurrency: currency,
      })
      return NextResponse.json({ ok: true, ignored: "payment_mismatch" })
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (eventId) {
          await tx.webhookReceipt.create({
            data: {
              provider: "paystack",
              eventId,
              topic: verified.event,
            },
          })
        }

        await tx.paymentAttempt.updateMany({
          where: {
            id: attempt.id,
            status: { in: ["INITIALIZED", "PENDING"] },
          },
          data: {
            status: "SUCCEEDED",
            providerTransactionId:
              rawEvent?.data?.id == null ? null : String(rawEvent.data.id),
            verifiedAt: new Date(),
          },
        })

        const transitioned = await tx.order.updateMany({
          where: {
            id: orderId,
            status: "PENDING",
            paymentMethod: "CARD",
          },
          data: {
            status: "PAID",
            reference,
          },
        })
        if (transitioned.count !== 1) {
          const currentOrder = await tx.order.findUnique({
            where: { id: orderId },
            select: { status: true, reference: true },
          })
          return {
            order: null,
            alreadyPaid: currentOrder?.status === "PAID",
            paidReference: currentOrder?.reference ?? null,
          }
        }

        await finalizeInventoryForOrder(tx, orderId, attempt.order.items)

        if (attempt.order.couponId) {
          await tx.coupon.update({
            where: { id: attempt.order.couponId },
            data: { usedCount: { increment: 1 } },
          })
        }

        const paidOrder = await tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: {
            user: true,
            items: { include: { product: true } },
            coupon: true,
          },
        })

        const updatedUser = await tx.user.update({
          where: { id: paidOrder.userId },
          data: { totalLifetimeSpend: { increment: paidOrder.totalNGN } },
          select: { totalLifetimeSpend: true },
        })
        await tx.user.update({
          where: { id: paidOrder.userId },
          data: {
            loyaltyTier: resolveLoyaltyTier(updatedUser.totalLifetimeSpend),
          },
        })

        const points = pointsForOrder(paidOrder.totalNGN)
        if (points > 0) {
          const prior = await tx.loyaltyLedger.aggregate({
            where: { userId: paidOrder.userId },
            _sum: { delta: true },
          })
          await tx.loyaltyLedger.create({
            data: {
              userId: paidOrder.userId,
              delta: points,
              reason: "order_earn",
              balanceAfter: (prior._sum.delta ?? 0) + points,
              orderId: paidOrder.id,
            },
          })
        }

        await enqueueOrderPaidEvents(tx, paidOrder.id)
        return { order: paidOrder, alreadyPaid: false, paidReference: reference }
      })

      if (!result.order) {
        if (result.alreadyPaid && result.paidReference !== reference) {
          logger.error("duplicate_successful_payment", {
            orderId,
            paymentAttemptId: attempt.id,
            reference,
          })
        }
        return NextResponse.json({ ok: true, duplicate: true })
      }

    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        return NextResponse.json({ ok: true, duplicate: true })
      }
      logger.error("paystack_webhook_processing_failed", {
        eventId,
        orderId,
        internal: String(error),
      })
      return NextResponse.json({ error: "processing_failed" }, { status: 500 })
    }
  } else if (
    verified.event === "refund.processed" ||
    verified.event === "charge.refunded"
  ) {
    const reference = verified.reference
    if (eventId) {
      const first = await recordWebhookOnce("paystack", eventId, verified.event)
      if (!first) return NextResponse.json({ ok: true, duplicate: true })
    }
    if (reference) {
      const attempt = await prisma.paymentAttempt.findUnique({
        where: { providerReference: reference },
        select: { id: true, order: { select: { id: true, userId: true } } },
      })
      if (attempt) {
        await prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: { status: "REFUNDED" },
        })
        await reversePointsForOrder(attempt.order.userId, attempt.order.id).catch((error) => {
          logger.error("refund_loyalty_reversal_failed", {
            orderId: attempt.order.id,
            internal: String(error),
          })
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
