import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { PaymentProvider } from "@/integrations/payments/types"
import { requestFullRefund } from "@/lib/refunds/service"
import { prisma } from "@/lib/prisma"

const hasDb = Boolean(process.env.DATABASE_URL)
const tag = `refund_request_itest_${Date.now()}_${Math.random()
  .toString(36)
  .slice(2, 8)}`

describe.skipIf(!hasDb)("durable refund request (DB)", () => {
  let adminId = ""
  let customerId = ""
  let productId = ""
  let orderId = ""
  let attemptId = ""
  let providerCalls = 0
  const paymentReference = `paid_${tag}`

  const provider: PaymentProvider = {
    name: "paystack",
    async initialize(input) {
      return {
        reference: input.reference,
        authorizationUrl: "https://example.test/pay",
      }
    },
    async verify(reference, expected) {
      return {
        reference,
        status: "success",
        amountNGN: expected.amountNGN,
        currency: expected.currency,
        amountMatches: true,
        paidAt: new Date().toISOString(),
      }
    },
    async refund(input) {
      providerCalls += 1
      return {
        providerRefundId: `provider_refund_${tag}`,
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
    const [admin, customer] = await Promise.all([
      prisma.user.create({
        data: {
          email: `${tag}_admin@example.test`,
          passwordHash: "x",
          role: "ADMIN",
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: `${tag}_customer@example.test`,
          passwordHash: "x",
        },
        select: { id: true },
      }),
    ])
    adminId = admin.id
    customerId = customer.id

    const product = await prisma.product.create({
      data: {
        name: `${tag} Product`,
        slug: `${tag}-product`,
        description: "test",
        images: ["/placeholder.png"],
        priceNGN: 75_000,
        category: "PERFUMES",
        publishStatus: "PUBLISHED",
        stock: 2,
      },
      select: { id: true },
    })
    productId = product.id

    const order = await prisma.order.create({
      data: {
        userId: customerId,
        status: "PAID",
        paymentMethod: "CARD",
        subtotalNGN: 75_000,
        totalNGN: 75_000,
        reference: paymentReference,
        addressLine1: "1 Test St",
        city: "Lagos",
        state: "Lagos",
        phone: "08000000000",
        items: {
          create: [{ productId, quantity: 1, priceNGN: 75_000 }],
        },
      },
      select: { id: true },
    })
    orderId = order.id

    const attempt = await prisma.paymentAttempt.create({
      data: {
        orderId,
        provider: "paystack",
        providerReference: paymentReference,
        idempotencyKey: `payment-${tag}`,
        expectedAmountNGN: 75_000,
        expectedCurrency: "NGN",
        status: "SUCCEEDED",
        verifiedAt: new Date(),
      },
      select: { id: true },
    })
    attemptId = attempt.id
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { targetType: "Refund", actorId: adminId },
    }).catch(() => {})
    await prisma.refund.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.paymentAttempt.deleteMany({ where: { id: attemptId } }).catch(() => {})
    await prisma.orderItem.deleteMany({ where: { orderId } }).catch(() => {})
    await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => {})
    await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {})
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, customerId] } },
    }).catch(() => {})
  })

  it("calls the provider once and returns the durable result on replay", async () => {
    const idempotencyKey = `refund-${tag}`
    const first = await requestFullRefund({
      orderId,
      idempotencyKey,
      reason: "Customer approved full refund",
      actorId: adminId,
      provider,
    })
    const replay = await requestFullRefund({
      orderId,
      idempotencyKey,
      reason: "Customer approved full refund",
      actorId: adminId,
      provider,
    })

    expect(providerCalls).toBe(1)
    expect(replay.id).toBe(first.id)
    expect(first.status).toBe("PROCESSING")
    expect(first.amountNGN).toBe(75_000)
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: orderId } }))
        .status,
    ).toBe("REFUND_PENDING")
    expect(
      await prisma.auditLog.count({
        where: {
          targetType: "Refund",
          targetId: first.id,
          action: "refund.request",
        },
      }),
    ).toBe(1)
  })
})
