import { route } from "@/lib/http/handler"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { resolveConciergeIdentity } from "@/lib/concierge/conversation"

export const runtime = "nodejs"
type AllowanceData = { authenticated: boolean; remaining: number | null; dailyLimit: number | null }
export const GET = route<AllowanceData>(async ({ req }) => {
  const { identity } = await resolveConciergeIdentity(req)
  if (identity.isAuthenticated) return { data: { authenticated: true, remaining: null, dailyLimit: env.CONCIERGE_AUTH_DAILY } }
  const usage = await prisma.conciergeGuestAllowance.findUnique({ where: { guestKeyHash: identity.guestKeyHash! }, select: { successCount: true } })
  return { data: { authenticated: false, remaining: Math.max(0, env.CONCIERGE_GUEST_QUESTIONS - (usage?.successCount ?? 0)), dailyLimit: null } }
})
