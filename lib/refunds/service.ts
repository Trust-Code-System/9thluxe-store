import type {
  PaymentProvider,
  ProviderRefundStatus,
} from "@/integrations/payments/types"
import type { Refund } from "@prisma/client"
import { writeAudit } from "@/lib/audit"
import { AppError } from "@/lib/http/errors"
import { prisma } from "@/lib/prisma"

function databaseRefundStatus(status: ProviderRefundStatus) {
  switch (status) {
    case "processing":
      return "PROCESSING" as const
    case "needs_attention":
      return "NEEDS_ATTENTION" as const
    case "processed":
      return "PROCESSED" as const
    case "failed":
      return "FAILED" as const
    default:
      return "PENDING" as const
  }
}

export async function requestFullRefund(input: {
  orderId: string
  idempotencyKey: string
  reason: string
  actorId: string
  provider: PaymentProvider
}) {
  const reason = input.reason.trim()
  if (reason.length < 3 || reason.length > 500) {
    throw new AppError("VALIDATION_ERROR", {
      message: "A refund reason between 3 and 500 characters is required.",
    })
  }

  const prior = await prisma.refund.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  })
  if (prior) {
    if (prior.orderId !== input.orderId) {
      throw new AppError("VALIDATION_ERROR", {
        message: "That idempotency key belongs to another refund.",
      })
    }
    return prior
  }

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      paymentMethod: "CARD",
    },
    include: {
      refund: { select: { id: true } },
      paymentAttempts: {
        where: { status: "SUCCEEDED" },
        orderBy: { verifiedAt: "desc" },
        take: 1,
      },
    },
  })
  if (!order) {
    throw new AppError("VALIDATION_ERROR", {
      message: "Only paid card orders can be refunded.",
    })
  }
  if (order.refund) {
    throw new AppError("VALIDATION_ERROR", {
      message: "A refund already exists for this order.",
    })
  }
  const attempt = order.paymentAttempts[0]
  if (!attempt) {
    throw new AppError("VALIDATION_ERROR", {
      message: "No successful payment attempt exists for this order.",
    })
  }

  let refund: Refund
  try {
    refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentAttemptId: attempt.id,
        provider: input.provider.name,
        idempotencyKey: input.idempotencyKey,
        amountNGN: order.totalNGN,
        currency: attempt.expectedCurrency,
        reason,
        previousOrderStatus: order.status,
        initiatedBy: input.actorId,
        restock: false,
      },
    })
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      const raced = await prisma.refund.findUnique({
        where: { orderId: order.id },
      })
      if (raced) return raced
    }
    throw error
  }

  let providerAccepted = false
  let acceptedProviderRefundId: string | null = null
  try {
    const providerResult = await input.provider.refund({
      reference: attempt.providerReference,
      amountNGN: order.totalNGN,
      currency: attempt.expectedCurrency,
      customerNote: reason,
      merchantNote: `Full refund requested by administrator ${input.actorId}`,
    })
    providerAccepted = true
    acceptedProviderRefundId = providerResult.providerRefundId

    if (
      providerResult.amountNGN !== order.totalNGN ||
      providerResult.currency !== attempt.expectedCurrency
    ) {
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: "NEEDS_ATTENTION",
          providerRefundId: providerResult.providerRefundId,
          failureCode: "PROVIDER_REFUND_MISMATCH",
        },
      })
      throw new AppError("PROVIDER_ERROR", {
        internal: {
          reason: "provider_refund_mismatch",
          refundId: refund.id,
        },
      })
    }
    if (providerResult.status === "failed") {
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: "FAILED",
          providerRefundId: providerResult.providerRefundId,
          failureCode: "PROVIDER_REFUND_FAILED",
        },
      })
      throw new AppError("PROVIDER_ERROR", {
        internal: {
          reason: "provider_refund_failed",
          refundId: refund.id,
        },
      })
    }

    refund = await prisma.$transaction(async (tx) => {
      const transitioned = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: "REFUND_PENDING" },
      })
      if (transitioned.count !== 1) {
        throw new AppError("VALIDATION_ERROR", {
          message: "The order changed while the refund was being initiated.",
        })
      }
      return tx.refund.update({
        where: { id: refund.id },
        data: {
          providerRefundId: providerResult.providerRefundId,
          status: databaseRefundStatus(providerResult.status),
          failureCode: null,
        },
      })
    })
  } catch (error) {
    await prisma.refund
      .updateMany({
        where: { id: refund.id, status: "REQUESTED" },
        data: {
          status: providerAccepted ? "NEEDS_ATTENTION" : "FAILED",
          providerRefundId: acceptedProviderRefundId,
          failureCode:
            providerAccepted
              ? "LOCAL_COMMIT_AFTER_PROVIDER_REFUND"
              : error instanceof AppError
                ? error.code
                : "PROVIDER_ERROR",
        },
      })
      .catch(() => {})
    throw error
  }

  await writeAudit({
    actorId: input.actorId,
    actorRole: "ADMIN",
    action: "refund.request",
    targetType: "Refund",
    targetId: refund.id,
    metadata: {
      orderId: order.id,
      amountNGN: refund.amountNGN,
      currency: refund.currency,
      reason,
    },
  })
  return refund
}
