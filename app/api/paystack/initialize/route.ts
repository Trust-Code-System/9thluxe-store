import crypto from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getPayments } from "@/integrations/registry"
import { isPaymentCollectionEnabled } from "@/integrations/payments/policy"
import { auth } from "@/lib/auth"
import { isValidIdempotencyKey } from "@/lib/checkout/idempotency"
import { getCommerceConfig } from "@/lib/config/commerce"
import { env } from "@/lib/env"
import { AppError } from "@/lib/http/errors"
import { consumeRateLimit } from "@/lib/middleware/limiter"
import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"
import { hasTrustedOrigin } from "@/lib/security/origin"

export const runtime = "nodejs"

const BodySchema = z.object({
  orderId: z.string().min(1),
}).strict()

function retryResponse(attempt: {
  orderId: string
  authorizationUrl: string | null
  providerReference: string
  status: string
  order: { user: { email: string } }
}, orderId: string, email: string) {
  if (
    attempt.orderId !== orderId ||
    attempt.order.user.email.toLowerCase() !== email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "That idempotency key belongs to a different payment" },
      { status: 409 },
    )
  }
  if (attempt.status === "PENDING" && attempt.authorizationUrl) {
    return NextResponse.json({
      authorization_url: attempt.authorizationUrl,
      reference: attempt.providerReference,
    })
  }
  if (attempt.status === "SUCCEEDED") {
    return NextResponse.json({ error: "This payment has already completed" }, { status: 409 })
  }
  if (attempt.status === "FAILED") {
    return NextResponse.json(
      { error: "That payment attempt failed. Please try again." },
      { status: 409 },
    )
  }
  return NextResponse.json(
    { error: "Payment initialization is already in progress. Please retry shortly." },
    { status: 409 },
  )
}

export async function POST(req: Request) {
  let attemptId: string | null = null
  try {
    if (!hasTrustedOrigin(req)) {
      return NextResponse.json({ error: "Request origin could not be verified" }, { status: 403 })
    }
    if (!isPaymentCollectionEnabled(env.PAYMENTS_ENABLED, env.PAYSTACK_SECRET_KEY)) {
      return NextResponse.json(
        { error: "Online payments are temporarily unavailable" },
        { status: 503 },
      )
    }
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: "Sign in to pay for an order" }, { status: 401 })
    }
    const payerHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex")
    const limit = await consumeRateLimit(
      `payments:initialize:${payerHash}`,
      5,
      5 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait and try again." },
        { status: 429 },
      )
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid order is required" }, { status: 400 })
    }
    const idempotencyKey = req.headers.get("idempotency-key")
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "A valid Idempotency-Key header is required" },
        { status: 400 },
      )
    }

    const prior = await prisma.paymentAttempt.findUnique({
      where: { idempotencyKey },
      select: {
        orderId: true,
        authorizationUrl: true,
        providerReference: true,
        status: true,
        order: { select: { user: { select: { email: true } } } },
      },
    })
    if (prior) return retryResponse(prior, parsed.data.orderId, email)

    const order = await prisma.order.findFirst({
      where: {
        id: parsed.data.orderId,
        status: "PENDING",
        paymentMethod: "CARD",
        user: { email },
      },
      select: {
        id: true,
        totalNGN: true,
        user: { select: { email: true } },
        inventoryReservations: {
          select: { status: true, expiresAt: true },
        },
      },
    })
    if (!order) {
      return NextResponse.json(
        { error: "That order is unavailable or already processed" },
        { status: 404 },
      )
    }
    if (
      order.inventoryReservations.length > 0 &&
      order.inventoryReservations.some(
        (reservation) =>
          reservation.status !== "RESERVED" || reservation.expiresAt <= new Date(),
      )
    ) {
      return NextResponse.json(
        { error: "This checkout reservation expired. Please return to your cart and try again." },
        { status: 409 },
      )
    }

    const provider = getPayments()
    if (provider.name !== "paystack") {
      return NextResponse.json(
        { error: "Card payments are not configured" },
        { status: 503 },
      )
    }

    const reference = `fade_${crypto.randomUUID().replaceAll("-", "")}`
    const currency = getCommerceConfig().shipping.currency
    try {
      const attempt = await prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: provider.name,
          providerReference: reference,
          idempotencyKey,
          expectedAmountNGN: order.totalNGN,
          expectedCurrency: currency,
        },
        select: { id: true },
      })
      attemptId = attempt.id
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        const raced = await prisma.paymentAttempt.findUnique({
          where: { idempotencyKey },
          select: {
            orderId: true,
            authorizationUrl: true,
            providerReference: true,
            status: true,
            order: { select: { user: { select: { email: true } } } },
          },
        })
        if (raced) return retryResponse(raced, order.id, email)
      }
      throw error
    }

    const result = await provider.initialize({
      orderId: order.id,
      reference,
      amountNGN: order.totalNGN,
      currency,
      email: order.user.email,
      callbackUrl: `${env.APP_URL.replace(/\/$/, "")}/checkout/success`,
      metadata: { orderId: order.id },
    })

    await prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: {
        providerReference: result.reference,
        authorizationUrl: result.authorizationUrl,
        status: "PENDING",
        initializedAt: new Date(),
      },
    })

    return NextResponse.json({
      authorization_url: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error) {
    if (attemptId) {
      await prisma.paymentAttempt
        .update({
          where: { id: attemptId },
          data: {
            status: "FAILED",
            failureCode: error instanceof AppError ? error.code : "INTERNAL_ERROR",
          },
        })
        .catch((updateError) => {
          logger.error("payment_attempt_failure_record_failed", {
            attemptId,
            internal: String(updateError),
          })
        })
    }
    const message =
      error instanceof AppError
        ? error.safeMessage
        : "We could not start your payment. Please try again."
    const status = error instanceof AppError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
