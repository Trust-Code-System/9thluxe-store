import { env } from "@/lib/env"
import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"

export interface JobBacklog {
  failedOutbox: number
  staleRunningOutbox: number
  overdueReservations: number
  overduePayments: number
  refundsNeedingAttention: number
}

export function classifyJobReadiness(backlog: JobBacklog) {
  return Object.values(backlog).some((count) => count > 0)
    ? "degraded" as const
    : "up" as const
}

export async function checkRedisReadiness() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return process.env.NODE_ENV === "production"
      ? "down" as const
      : "not_configured" as const
  }
  try {
    const response = await fetch(
      `${env.UPSTASH_REDIS_REST_URL.replace(/\/$/, "")}/ping`,
      {
        headers: {
          Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(2_000),
      },
    )
    if (!response.ok) return "down" as const
    const payload = await response.json() as { result?: string }
    return payload.result === "PONG" ? "up" as const : "down" as const
  } catch (error) {
    logger.warn("redis_readiness_failed", { internal: String(error) })
    return "down" as const
  }
}

export async function checkJobReadiness(now = new Date()) {
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
  try {
    const [
      failedOutbox,
      staleRunningOutbox,
      overdueReservations,
      overduePayments,
      refundsNeedingAttention,
    ] = await Promise.all([
      prisma.outboxEvent.count({ where: { status: "FAILED" } }),
      prisma.outboxEvent.count({
        where: { status: "RUNNING", lockedAt: { lte: fiveMinutesAgo } },
      }),
      prisma.inventoryReservation.count({
        where: { status: "RESERVED", expiresAt: { lte: now } },
      }),
      prisma.paymentAttempt.count({
        where: {
          status: "PENDING",
          failureCode: null,
          initializedAt: { lte: fifteenMinutesAgo },
        },
      }),
      prisma.refund.count({
        where: { status: "NEEDS_ATTENTION" },
      }),
    ])
    const backlog = {
      failedOutbox,
      staleRunningOutbox,
      overdueReservations,
      overduePayments,
      refundsNeedingAttention,
    }
    const status = classifyJobReadiness(backlog)
    if (status === "degraded") {
      logger.warn("job_readiness_degraded", backlog)
    }
    return { status, backlog }
  } catch (error) {
    logger.error("job_readiness_failed", { internal: String(error) })
    return { status: "down" as const, backlog: null }
  }
}
