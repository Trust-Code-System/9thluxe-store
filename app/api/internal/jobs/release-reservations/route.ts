import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { releaseExpiredReservations } from "@/lib/inventory/reservations"
import { logger } from "@/lib/observability/logger"
import { hasValidBearerSecret } from "@/lib/security/bearer"

export const runtime = "nodejs"

export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "job_not_configured" }, { status: 503 })
  }
  if (!hasValidBearerSecret(req.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await releaseExpiredReservations()
    logger.info("inventory_reservations_expired", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    logger.error("inventory_reservation_expiry_failed", {
      internal: String(error),
    })
    return NextResponse.json({ error: "job_failed" }, { status: 500 })
  }
}

// Vercel Cron invokes configured routes with GET. Keep POST for external schedulers and runbooks.
export const GET = POST
