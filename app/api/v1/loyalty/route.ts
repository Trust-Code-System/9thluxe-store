// app/api/v1/loyalty/route.ts
// GET /api/v1/loyalty -> the signed-in user's tier, lifetime spend, and points balance.
// Redemption is reported as available only when the `loyalty_rewards` flag is on (default OFF).
import { route, raise } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { computeBalance } from '@/lib/loyalty/points'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')

  const user = await prisma.user.findUnique({
    where: { email: email as string },
    select: { id: true, loyaltyTier: true, totalLifetimeSpend: true },
  })
  if (!user) raise('UNAUTHENTICATED')

  const entries = await prisma.loyaltyLedger.findMany({ where: { userId: user!.id }, select: { delta: true } })
  const pointsBalance = computeBalance(entries)

  return {
    data: {
      tier: user!.loyaltyTier,
      lifetimeSpendNGN: user!.totalLifetimeSpend,
      pointsBalance,
      redemptionEnabled: isFeatureEnabled('loyalty_rewards'),
    },
  }
})
