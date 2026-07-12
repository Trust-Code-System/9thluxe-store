import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/http/errors"
import { consumeRateLimit, clientIp } from "@/lib/middleware/limiter"
import type { ConciergeIdentity, ConciergeTurnResult } from "./types"

const startOfDay = () => { const value = new Date(); value.setUTCHours(0, 0, 0, 0); return value }
const startOfMonth = () => { const value = new Date(); value.setUTCDate(1); value.setUTCHours(0, 0, 0, 0); return value }

export async function assertConciergeEntitlement(req: { headers: { get(name: string): string | null } }, identity: ConciergeIdentity, requiresWebResearch: boolean) {
  if (!identity.isAuthenticated) {
    const allowance = await prisma.conciergeGuestAllowance.findUnique({ where: { guestKeyHash: identity.guestKeyHash! }, select: { successCount: true } })
    if ((allowance?.successCount ?? 0) >= env.CONCIERGE_GUEST_QUESTIONS) throw new AppError("GUEST_ALLOWANCE_EXHAUSTED")
    return
  }
  const perMinute = await consumeRateLimit(`concierge-v2:user:${identity.userId}`, env.CONCIERGE_AUTH_PER_MINUTE, 60_000)
  if (!perMinute.ok) throw new AppError("RATE_LIMITED")
  const [daily, webDaily, daySpend, monthSpend] = await Promise.all([
    prisma.conciergeUsageEvent.count({ where: { userId: identity.userId, completionStatus: "SUCCESS", createdAt: { gte: startOfDay() } } }),
    requiresWebResearch ? prisma.conciergeUsageEvent.aggregate({ where: { userId: identity.userId, createdAt: { gte: startOfDay() } }, _sum: { searchCalls: true } }) : null,
    prisma.conciergeUsageEvent.aggregate({ where: { createdAt: { gte: startOfDay() } }, _sum: { estimatedCostMicros: true } }),
    prisma.conciergeUsageEvent.aggregate({ where: { createdAt: { gte: startOfMonth() } }, _sum: { estimatedCostMicros: true } }),
  ])
  if (daily >= env.CONCIERGE_AUTH_DAILY) throw new AppError("DAILY_LIMIT_REACHED")
  if (requiresWebResearch && (webDaily?._sum.searchCalls ?? 0) >= env.CONCIERGE_WEB_DAILY) throw new AppError("WEB_SEARCH_LIMIT_REACHED")
  if ((daySpend._sum.estimatedCostMicros ?? 0) >= env.CONCIERGE_DAILY_SPEND_USD * 1_000_000 || (monthSpend._sum.estimatedCostMicros ?? 0) >= env.CONCIERGE_MONTHLY_SPEND_USD * 1_000_000) throw new AppError("AI_BUDGET_REACHED")
  void clientIp(req)
}

export async function recordConciergeUsage(input: {
  requestId: string; identity: ConciergeIdentity; result?: ConciergeTurnResult; startedAt: number;
  completionStatus: "SUCCESS" | "FAILED" | "CANCELLED"; errorCode?: string
}) {
  const result = input.result
  await prisma.conciergeUsageEvent.create({ data: {
    requestId: input.requestId, conversationId: result?.conversationId, userId: input.identity.userId,
    guestKeyHash: input.identity.guestKeyHash, intent: result?.intent.primaryIntent ?? "UNKNOWN",
    provider: result?.provider, model: result?.model, promptVersion: "concierge-v2.1",
    toolCalls: result?.usage.toolCalls ?? [], searchCalls: result?.usage.searchCalls ?? 0,
    inputTokens: result?.usage.inputTokens ?? 0, outputTokens: result?.usage.outputTokens ?? 0,
    totalLatencyMs: Date.now() - input.startedAt, completionStatus: input.completionStatus,
    errorCode: input.errorCode, citationsUsed: Boolean(result?.sources.length), estimatedCostMicros: 0,
  } }).catch(() => undefined)
}
