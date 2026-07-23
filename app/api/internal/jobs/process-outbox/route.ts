import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { processOutboxBatch } from "@/lib/jobs/outbox"
import { logger } from "@/lib/observability/logger"
import { hasValidBearerSecret } from "@/lib/security/bearer"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "job_not_configured" }, { status: 503 })
  }
  if (!hasValidBearerSecret(req.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await processOutboxBatch({ limit: 20 })
    logger.info("outbox_batch_processed", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    logger.error("outbox_batch_failed", { internal: String(error) })
    return NextResponse.json({ error: "job_failed" }, { status: 500 })
  }
}

// Vercel Cron invokes configured routes with GET. Keep POST for external schedulers and runbooks.
export const GET = POST
