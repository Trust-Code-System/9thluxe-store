import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getPayments } from "@/integrations/registry"
import { getAdminUser } from "@/lib/admin"
import { isValidIdempotencyKey } from "@/lib/checkout/idempotency"
import { AppError } from "@/lib/http/errors"
import { consumeRateLimit } from "@/lib/middleware/limiter"
import { logger } from "@/lib/observability/logger"
import { requestFullRefund } from "@/lib/refunds/service"
import { hasTrustedOrigin } from "@/lib/security/origin"

const bodySchema = z.object({
  reason: z.string().trim().min(3).max(500),
}).strict()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json(
        { error: "Request origin could not be verified" },
        { status: 403 },
      )
    }
    const admin = await getAdminUser()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const limit = await consumeRateLimit(
      `admin-refund:user:${admin.id}`,
      5,
      60 * 60 * 1000,
      false,
    )
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many refund requests. Try again later." },
        { status: 429 },
      )
    }

    const idempotencyKey = request.headers.get("idempotency-key")
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "A valid Idempotency-Key header is required" },
        { status: 400 },
      )
    }
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A refund reason is required" },
        { status: 400 },
      )
    }

    const { id: orderId } = await params
    const refund = await requestFullRefund({
      orderId,
      idempotencyKey,
      reason: parsed.data.reason,
      actorId: admin.id,
      provider: getPayments(),
    })
    return NextResponse.json({
      ok: true,
      refund: {
        id: refund.id,
        status: refund.status,
        amountNGN: refund.amountNGN,
        currency: refund.currency,
      },
    })
  } catch (error) {
    logger.error("admin_refund_request_failed", {
      internal: String(error),
    })
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.safeMessage },
        { status: error.status },
      )
    }
    return NextResponse.json(
      { error: "Unable to request refund" },
      { status: 500 },
    )
  }
}
