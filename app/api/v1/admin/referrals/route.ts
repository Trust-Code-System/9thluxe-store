// app/api/v1/admin/referrals/route.ts
// GET  /api/v1/admin/referrals?status=QUALIFIED -> list referrals
// POST /api/v1/admin/referrals { referralId, op } -> request reward (creates approval) or reverse.
// Reward payout is NEVER automatic; it is routed through the Approval Centre and flag-gated.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { prisma } from '@/lib/prisma'
import { requestReferralReward, reverseReferral } from '@/lib/referrals/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSES = ['PENDING', 'QUALIFIED', 'REWARDED', 'REVERSED']

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'marketing:manage')) raise('FORBIDDEN')
  const statusParam = req.nextUrl.searchParams.get('status')?.toUpperCase()
  const where = statusParam && STATUSES.includes(statusParam) ? { status: statusParam } : {}
  const referrals = await prisma.referral.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
  return { data: { referrals }, meta: { count: referrals.length } }
})

const bodySchema = z.object({
  referralId: z.string().min(1),
  op: z.enum(['request_reward', 'reverse']),
})

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'marketing:manage')) raise('FORBIDDEN')
  const { referralId, op } = bodySchema.parse(await req.json())
  const data: { approval: unknown; referral: unknown } = { approval: null, referral: null }
  if (op === 'request_reward') {
    const result = await requestReferralReward(referralId, admin!.id)
    data.approval = result.approval
  } else {
    data.referral = await reverseReferral(referralId, admin!.id)
  }
  return { data }
})
