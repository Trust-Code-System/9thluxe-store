// app/api/v1/referrals/route.ts
// GET /api/v1/referrals -> the signed-in user's referral code (created on first request) + status.
// Reward payouts stay disabled behind the `referral_rewards` flag (default OFF) until approved.
import { route, raise } from '@/lib/http/handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { generateReferralCode } from '@/lib/referrals/code'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')

  const user = await prisma.user.findUnique({
    where: { email: email as string },
    select: { id: true, referralCode: true },
  })
  if (!user) raise('UNAUTHENTICATED')

  let code = user!.referralCode
  if (!code) {
    // Assign a unique code, retrying on the rare collision (referralCode is unique).
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateReferralCode()
      try {
        const updated = await prisma.user.update({
          where: { id: user!.id },
          data: { referralCode: candidate },
          select: { referralCode: true },
        })
        code = updated.referralCode
      } catch {
        // unique collision -> retry
      }
    }
  }

  const referredCount = await prisma.referral.count({ where: { referrerId: user!.id } })

  return {
    data: {
      code,
      referredCount,
      rewardsEnabled: isFeatureEnabled('referral_rewards'),
    },
  }
})
