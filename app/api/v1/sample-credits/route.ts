// app/api/v1/sample-credits/route.ts
// GET  /api/v1/sample-credits          -> the signed-in user's usable credit balance + credits
// POST /api/v1/sample-credits (preview) -> preview how much credit would apply to an amount
//
// Redemption is gated by the `sample_credits` feature flag (default OFF until pricing rules are
// approved). Granting credits is an admin/approval action, not exposed here.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applyCredits, usableBalance, type CreditRecord } from '@/lib/samples/credits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function loadCredits(): Promise<{ userId: string; credits: CreditRecord[] }> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) raise('UNAUTHENTICATED')
  const user = await prisma.user.findUnique({ where: { email: email as string }, select: { id: true } })
  if (!user) raise('UNAUTHENTICATED')
  const rows = await prisma.sampleCredit.findMany({
    where: { userId: user!.id },
    select: { id: true, remainingNGN: true, expiresAt: true },
  })
  return {
    userId: user!.id,
    credits: rows.map((r) => ({ id: r.id, remainingNGN: r.remainingNGN, expiresAt: r.expiresAt?.toISOString() ?? null })),
  }
}

export const GET = route(async () => {
  const { credits } = await loadCredits()
  return { data: { balanceNGN: usableBalance(credits), credits } }
})

const previewSchema = z.object({ amountNGN: z.number().int().positive() })

export const POST = route(async ({ req }) => {
  if (!isFeatureEnabled('sample_credits')) raise('FEATURE_DISABLED')
  const { amountNGN } = previewSchema.parse(await req.json())
  const { credits } = await loadCredits()
  const application = applyCredits(credits, amountNGN)
  return { data: { preview: true, ...application } }
})
