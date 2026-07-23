import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type {
  InitPaymentInput,
  PaymentProvider,
} from "@/integrations/payments/types"
import { reserveInventory } from "@/lib/inventory/reservations"
import { reconcilePaymentAttempt } from "@/lib/payments/reconciliation"
import { prisma } from "@/lib/prisma"

const hasDb = Boolean(process.env.DATABASE_URL)
const tag = `reconciliation_itest_${Date.now()}_${Math.random()
  .toString(36)
  .slice(2, 8)}`

describe.skipIf(!hasDb)("payment reconciliation settlement (DB)", () => {
  let userId = ""
  let productId = ""
  let orderId = ""
  let attemptId = ""
  const reference = `paystack_${tag}`

  const provider: PaymentProvider = {
    name: "paystack",
    async initialize(input: InitPaymentInput) {
      return {
        reference: input.reference,
        authorizationUrl: "https://example.test/pay",
      }
    },
    async verify(receivedReference, expected) {
      return {
        reference: receivedReference,
        status: "success",
        amountNGN: expected.amountNGN,
        currency: expected.currency,
        amountMatches: true,
        paidAt: new Date().toISOString(),
      }
    },
    async refund(input) {
      return {
        providerRefundId: `refund_${input.reference}`,
        status: "processing",
        amountNGN: input.amountNGN,
        currency: input.currency,
      }
    },
    verifyWebhook() {
      return { valid: false }
    },
  }

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${tag}@example.test`,
        passwordHash: "x",
        name: "Reconciliation Test",
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
        stock: 3,
      },
      select: { id: true },
    })
    productId = product.id

    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        paymentMethod: "CARD",
        totalNGN: 50_000,
        subtotalNGN: 50_000,
        addressLine1: "1 Test St",
        city: "Lagos",
        state: "Lagos",
        phone: "08000000000",
        items: {
          create: [{ productId, quantity: 1, priceNGN: 50_000 }],
        },
      },
      select: { id: true },
    })
    orderId = order.id

    await prisma.$transaction((tx) =>
      reserveInventory(
        tx,
        orderId,
        [{ productId, quantity: 1 }],
        new Date(Date.now() + 30 * 60 * 1000),
      ),
    )

    const attempt = await prisma.paymentAttempt.create({
      data: {
        orderId,
        provider: "paystack",
        providerReference: reference,
        idempotencyKey: `reconcile-${tag}`,
        expectedAmountNGN: 50_000,
        expectedCurrency: "NGN",
        status: "PENDING",
        initializedAt: new Date(),
      },
      select: { id: true },
    })
    attemptId = attempt.id
  })

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: orderId },
    }).catch(() => {})
    await prisma.loyaltyLedger.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.paymentAttempt.deleteMany({ where: { id: attemptId } }).catch(() => {})
    await prisma.inventoryMovement.deleteMany({
      where: { sourceId: orderId },
    }).catch(() => {})
    await prisma.inventoryReservation.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {})
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {})
  })

  it("settles a missed webhook exactly once", async () => {
    expect(await reconcilePaymentAttempt(attemptId, provider)).toBe("settled")

    const [attempt, order, reservation, product, events] = await Promise.all([
      prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } }),
      prisma.order.findUniqueOrThrow({ where: { id: orderId } }),
      prisma.inventoryReservation.findUniqueOrThrow({
        where: { orderId_productId: { orderId, productId } },
      }),
      prisma.product.findUniqueOrThrow({ where: { id: productId } }),
      prisma.outboxEvent.count({ where: { aggregateId: orderId } }),
    ])

    expect(attempt.status).toBe("SUCCEEDED")
    expect(order.status).toBe("PAID")
    expect(order.reference).toBe(reference)
    expect(reservation.status).toBe("SOLD")
    expect(product.stock).toBe(2)
    expect(events).toBe(3)

    expect(await reconcilePaymentAttempt(attemptId, provider)).toBe("skipped")
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: orderId } }),
    ).toBe(3)
  })
})
