import crypto from "crypto"
import type { OutboxEvent, Prisma } from "@prisma/client"

import { sendReceipt } from "@/emails/sendReceipt"
import { AppError } from "@/lib/http/errors"
import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"
import { qualifyReferral } from "@/lib/referrals/service"

export const OUTBOX_TYPES = {
  ORDER_RECEIPT: "ORDER_RECEIPT",
  ADMIN_ORDER_PAID_NOTIFICATION: "ADMIN_ORDER_PAID_NOTIFICATION",
  REFERRAL_QUALIFICATION: "REFERRAL_QUALIFICATION",
} as const

export function outboxRetryDelayMs(attempts: number): number {
  const exponent = Math.max(0, Math.min(attempts - 1, 8))
  return Math.min(2 ** exponent * 30_000, 60 * 60 * 1000)
}

export async function enqueueOrderPaidEvents(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  await tx.outboxEvent.createMany({
    data: [
      {
        type: OUTBOX_TYPES.ORDER_RECEIPT,
        aggregateType: "Order",
        aggregateId: orderId,
        idempotencyKey: `order-receipt:${orderId}`,
      },
      {
        type: OUTBOX_TYPES.ADMIN_ORDER_PAID_NOTIFICATION,
        aggregateType: "Order",
        aggregateId: orderId,
        idempotencyKey: `admin-order-paid:${orderId}`,
      },
      {
        type: OUTBOX_TYPES.REFERRAL_QUALIFICATION,
        aggregateType: "Order",
        aggregateId: orderId,
        idempotencyKey: `referral-qualification:${orderId}`,
      },
    ],
    skipDuplicates: true,
  })
}

async function loadPaidOrder(orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    include: {
      user: true,
      items: { include: { product: true } },
      coupon: true,
    },
  })
}

export async function handleOutboxEvent(event: OutboxEvent) {
  if (event.aggregateType !== "Order") {
    throw new AppError("INTERNAL_ERROR", {
      internal: { reason: "unsupported_outbox_aggregate", eventId: event.id },
    })
  }
  const order = await loadPaidOrder(event.aggregateId)
  if (!order) {
    throw new AppError("NOT_FOUND", {
      internal: { reason: "outbox_order_not_found_or_unpaid", eventId: event.id },
    })
  }

  switch (event.type) {
    case OUTBOX_TYPES.ORDER_RECEIPT:
      await sendReceipt(order, event.idempotencyKey)
      return
    case OUTBOX_TYPES.ADMIN_ORDER_PAID_NOTIFICATION:
      await prisma.notification.upsert({
        where: { dedupeKey: event.idempotencyKey },
        update: {},
        create: {
          type: "ORDER_PAID",
          title: "New Order Payment",
          message: `Order #${order.reference || order.id.slice(0, 8)} has been paid. Total: NGN ${order.totalNGN.toLocaleString()}`,
          orderId: order.id,
          dedupeKey: event.idempotencyKey,
        },
      })
      return
    case OUTBOX_TYPES.REFERRAL_QUALIFICATION:
      await qualifyReferral(order.userId, order.id)
      return
    default:
      throw new AppError("INTERNAL_ERROR", {
        internal: {
          reason: "unsupported_outbox_event_type",
          eventId: event.id,
          eventType: event.type,
        },
      })
  }
}

async function recoverStaleClaims(now: Date) {
  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000)
  return prisma.outboxEvent.updateMany({
    where: { status: "RUNNING", lockedAt: { lte: staleBefore } },
    data: {
      status: "PENDING",
      lockedAt: null,
      lockedBy: null,
      availableAt: now,
    },
  })
}

async function claimNextEvent(workerId: string, now: Date) {
  for (let collision = 0; collision < 5; collision += 1) {
    const candidate = await prisma.outboxEvent.findFirst({
      where: { status: "PENDING", availableAt: { lte: now } },
      orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    })
    if (!candidate) return null

    const claimed = await prisma.outboxEvent.updateMany({
      where: { id: candidate.id, status: "PENDING", lockedAt: null },
      data: {
        status: "RUNNING",
        attempts: { increment: 1 },
        lockedAt: now,
        lockedBy: workerId,
      },
    })
    if (claimed.count === 1) {
      return prisma.outboxEvent.findUniqueOrThrow({ where: { id: candidate.id } })
    }
  }
  return null
}

function safeFailureCode(error: unknown): string {
  if (error instanceof AppError) return error.code
  if (error instanceof Error && error.name) return error.name.slice(0, 100)
  return "UNKNOWN_ERROR"
}

export async function processOutboxBatch(
  options: { limit?: number; workerId?: string; now?: Date } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50)
  const workerId = options.workerId ?? `worker_${crypto.randomUUID()}`
  const startedAt = options.now ?? new Date()
  const recovered = await recoverStaleClaims(startedAt)
  let processed = 0
  let retried = 0
  let failed = 0

  for (let index = 0; index < limit; index += 1) {
    const event = await claimNextEvent(workerId, new Date())
    if (!event) break
    try {
      await handleOutboxEvent(event)
      await prisma.outboxEvent.updateMany({
        where: { id: event.id, status: "RUNNING", lockedBy: workerId },
        data: {
          status: "SUCCEEDED",
          processedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
      })
      processed += 1
    } catch (error) {
      const terminal = event.attempts >= event.maxAttempts
      const now = new Date()
      await prisma.outboxEvent.updateMany({
        where: { id: event.id, status: "RUNNING", lockedBy: workerId },
        data: terminal
          ? {
              status: "FAILED",
              lockedAt: null,
              lockedBy: null,
              lastError: safeFailureCode(error),
            }
          : {
              status: "PENDING",
              lockedAt: null,
              lockedBy: null,
              availableAt: new Date(now.getTime() + outboxRetryDelayMs(event.attempts)),
              lastError: safeFailureCode(error),
            },
      })
      logger.error("outbox_event_failed", {
        eventId: event.id,
        eventType: event.type,
        attempts: event.attempts,
        terminal,
        internal: String(error),
      })
      if (terminal) failed += 1
      else retried += 1
    }
  }

  return {
    processed,
    retried,
    failed,
    recovered: recovered.count,
  }
}
