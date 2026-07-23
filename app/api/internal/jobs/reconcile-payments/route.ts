import { NextResponse } from "next/server"

import { getPayments } from "@/integrations/registry"
import { env } from "@/lib/env"
import { logger } from "@/lib/observability/logger"
import {
  reconcilePendingPayments,
  reconcilePendingRefunds,
} from "@/lib/payments/reconciliation"
import { hasValidBearerSecret } from "@/lib/security/bearer"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "job_not_configured" },
      { status: 503 },
    )
  }
  if (
    !hasValidBearerSecret(
      req.headers.get("authorization"),
      env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const provider = getPayments()
  if (provider.name !== "paystack") {
    return NextResponse.json(
      { error: "payment_provider_unavailable" },
      { status: 503 },
    )
  }

  try {
    const [payments, refunds] = await Promise.all([
      reconcilePendingPayments({ provider, limit: 20 }),
      reconcilePendingRefunds({ provider, limit: 20 }),
    ])
    logger.info("payment_reconciliation_batch_processed", {
      payments,
      refunds,
    })
    return NextResponse.json({ ok: true, payments, refunds })
  } catch (error) {
    logger.error("payment_reconciliation_batch_failed", {
      internal: String(error),
    })
    return NextResponse.json({ error: "job_failed" }, { status: 500 })
  }
}

// Vercel Cron invokes configured routes with GET. Keep POST for external schedulers and runbooks.
export const GET = POST
