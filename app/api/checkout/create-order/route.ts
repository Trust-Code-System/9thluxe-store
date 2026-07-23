import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { computeCheckoutShipping } from "@/lib/config/commerce"
import { getBankTransferConfig } from "@/lib/config/payment-methods"
import {
  checkoutRequestHash,
  isValidIdempotencyKey,
} from "@/lib/checkout/idempotency"
import { consumeRateLimit } from "@/lib/middleware/limiter"
import { validateCoupon } from "@/lib/pricing"
import { hasTrustedOrigin } from "@/lib/security/origin"
import { AppError } from "@/lib/http/errors"
import { env } from "@/lib/env"
import { isPaymentCollectionEnabled } from "@/integrations/payments/policy"
import {
  aggregateInventoryLines,
  reservationExpiry,
  reserveInventory,
} from "@/lib/inventory/reservations"

const createOrderSchema = z.object({
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  phone: z.string().min(10, "Phone is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      priceNGN: z.number().int().min(0),
    })
  ).min(1, "Cart is empty"),
  // Accepted temporarily for older clients, but all monetary values are recomputed below.
  subtotalNGN: z.number().int().min(0).optional(),
  discountNGN: z.number().int().min(0).optional(),
  shippingNGN: z.number().int().min(0).optional(),
  totalNGN: z.number().int().min(0).optional(),
  couponId: z.string().optional().nullable(),
  couponCode: z.string().trim().max(100).optional().nullable(),
  deliveryMethod: z.enum(["standard", "express"]).default("standard"),
  isGift: z.boolean().optional().default(false),
  giftMessage: z.string().max(500).optional().nullable(),
  giftWrapping: z.boolean().optional().default(false),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER"]).optional().default("CARD"),
})

export async function POST(req: NextRequest) {
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 })
    }
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Sign in to checkout" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    const limit = await consumeRateLimit(
      `checkout:create-order:${user.id}`,
      10,
      10 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait and try again." },
        { status: 429 },
      )
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ")
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const idempotencyKey = req.headers.get("idempotency-key")
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "A valid Idempotency-Key header is required" },
        { status: 400 },
      )
    }

    const {
      addressLine1,
      city,
      state,
      phone,
      items,
      couponCode,
      deliveryMethod,
      isGift,
      giftMessage,
      giftWrapping,
      paymentMethod,
    } = parsed.data

    if (
      paymentMethod === "CARD" &&
      !isPaymentCollectionEnabled(env.PAYMENTS_ENABLED, env.PAYSTACK_SECRET_KEY)
    ) {
      return NextResponse.json(
        { error: "Online payments are temporarily unavailable" },
        { status: 503 },
      )
    }
    if (paymentMethod === "BANK_TRANSFER" && !getBankTransferConfig()) {
      return NextResponse.json(
        { error: "Bank transfer is not currently available" },
        { status: 400 },
      )
    }

    const requestHash = checkoutRequestHash({
      addressLine1,
      city,
      state,
      phone,
      items,
      couponCode,
      deliveryMethod,
      isGift,
      giftMessage,
      giftWrapping,
      paymentMethod,
    })
    const priorAttempt = await prisma.checkoutAttempt.findUnique({
      where: {
        userId_idempotencyKey: {
          userId: user.id,
          idempotencyKey,
        },
      },
      select: { orderId: true, requestHash: true },
    })
    if (priorAttempt) {
      if (priorAttempt.requestHash !== requestHash) {
        return NextResponse.json(
          { error: "That checkout key was already used for different order details" },
          { status: 409 },
        )
      }
      return NextResponse.json({ orderId: priorAttempt.orderId, reused: true })
    }

    // Resolve product IDs and validate prices (use DB price for consistency)
    const inventoryLines = aggregateInventoryLines(items)
    const productIds = inventoryLines.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      select: { id: true, priceNGN: true, stock: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const orderItems: { productId: string; quantity: number; priceNGN: number }[] = []
    for (const item of inventoryLines) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
      }
      if (item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.productId}. Max: ${product.stock}` },
          { status: 400 }
        )
      }
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceNGN: product.priceNGN,
      })
    }

    const computedSubtotal = orderItems.reduce((s, i) => s + i.priceNGN * i.quantity, 0)
    let computedDiscount = 0
    let validatedCouponId: string | null = null
    if (couponCode) {
      const coupon = await validateCoupon(couponCode, computedSubtotal)
      if (!coupon.ok) {
        return NextResponse.json({ error: coupon.message }, { status: 400 })
      }
      computedDiscount = coupon.discountNGN
      validatedCouponId = coupon.couponId
    }
    const computedShipping = computeCheckoutShipping(
      computedSubtotal,
      deliveryMethod,
      giftWrapping,
    )
    const orderTotal = computedSubtotal - computedDiscount + computedShipping

    let order: { id: string }
    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId: user.id,
            status: "PENDING",
            subtotalNGN: computedSubtotal,
            discountNGN: computedDiscount,
            shippingNGN: computedShipping,
            totalNGN: orderTotal,
            couponId: validatedCouponId,
            addressLine1,
            city,
            state,
            phone,
            isGift,
            giftMessage: giftMessage || null,
            giftWrapping,
            paymentMethod,
            items: {
              create: orderItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                priceNGN: i.priceNGN,
              })),
            },
          },
          select: { id: true },
        })
        await tx.checkoutAttempt.create({
          data: {
            userId: user.id,
            orderId: created.id,
            idempotencyKey,
            requestHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        })
        await reserveInventory(
          tx,
          created.id,
          orderItems,
          reservationExpiry(paymentMethod),
        )
        return created
      })
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error
      const concurrent = await prisma.checkoutAttempt.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: user.id,
            idempotencyKey,
          },
        },
        select: { orderId: true, requestHash: true },
      })
      if (!concurrent || concurrent.requestHash !== requestHash) throw error
      order = { id: concurrent.orderId }
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error("Create order error:", error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.safeMessage }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
