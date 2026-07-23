import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  enqueueOrderPaidEvents,
  OUTBOX_TYPES,
  processOutboxBatch,
} from "@/lib/jobs/outbox"
import { prisma } from "@/lib/prisma"

const hasDb = Boolean(process.env.DATABASE_URL)
const tag = `outbox_itest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

describe.skipIf(!hasDb)("transactional outbox (DB)", () => {
  let userId = ""
  let productId = ""
  let orderId = ""

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${tag}@example.test`,
        passwordHash: "x",
        name: "Outbox <Test>",
      },
      select: { id: true },
    })
    userId = user.id
    const product = await prisma.product.create({
      data: {
        name: `${tag} Product`,
        slug: `${tag}-product`,
        description: "test",
        images: ["/placeholder.png"],
        priceNGN: 50_000,
        category: "PERFUMES",
        publishStatus: "PUBLISHED",
        stock: 5,
      },
      select: { id: true },
    })
    productId = product.id
    const order = await prisma.order.create({
      data: {
        userId,
        status: "PAID",
        reference: `ref_${tag}`,
        subtotalNGN: 50_000,
        totalNGN: 50_000,
        addressLine1: "1 Test St",
        city: "Lagos",
        state: "Lagos",
        phone: "08000000000",
        items: { create: [{ productId, quantity: 1, priceNGN: 50_000 }] },
      },
      select: { id: true },
    })
    orderId = order.id
  })

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.outboxEvent.deleteMany({
      where: { aggregateType: "Order", aggregateId: orderId },
    }).catch(() => {})
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {})
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {})
  })

  it("processes order effects and deduplicates an event replay", async () => {
    await prisma.$transaction((tx) => enqueueOrderPaidEvents(tx, orderId))
    const first = await processOutboxBatch({ limit: 10, workerId: `${tag}_worker` })
    expect(first.processed).toBe(3)

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateType: "Order", aggregateId: orderId },
      select: { type: true, status: true },
    })
    expect(events).toHaveLength(3)
    expect(events.every((event) => event.status === "SUCCEEDED")).toBe(true)
    expect(await prisma.notification.count({ where: { orderId } })).toBe(1)

    await prisma.outboxEvent.update({
      where: { idempotencyKey: `admin-order-paid:${orderId}` },
      data: {
        status: "PENDING",
        availableAt: new Date(),
        processedAt: null,
      },
    })
    const replay = await processOutboxBatch({ limit: 1, workerId: `${tag}_replay` })
    expect(replay.processed).toBe(1)
    expect(await prisma.notification.count({ where: { orderId } })).toBe(1)
  })

  it("moves an exhausted unsupported event to the failed state", async () => {
    const event = await prisma.outboxEvent.create({
      data: {
        type: "UNSUPPORTED_TEST_EVENT",
        aggregateType: "Order",
        aggregateId: orderId,
        idempotencyKey: `unsupported:${orderId}`,
        maxAttempts: 1,
      },
    })
    const result = await processOutboxBatch({ limit: 1, workerId: `${tag}_failure` })
    expect(result.failed).toBe(1)
    expect((await prisma.outboxEvent.findUniqueOrThrow({
      where: { id: event.id },
      select: { status: true, lastError: true },
    }))).toEqual({ status: "FAILED", lastError: "INTERNAL_ERROR" })
  })

  it("uses distinct durable effects for each order-paid consequence", () => {
    expect(Object.values(OUTBOX_TYPES)).toEqual([
      "ORDER_RECEIPT",
      "ADMIN_ORDER_PAID_NOTIFICATION",
      "REFERRAL_QUALIFICATION",
    ])
  })
})
