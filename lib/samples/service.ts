// lib/samples/service.ts
// DB-touching sample-credit operations: administrative granting (audited), redemption against an
// order (duplicate-guarded by the unique [creditId, orderId] constraint), and full-bottle
// conversion. Redemption is gated by the `sample_credits` feature flag.
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { applyCredits, type CreditRecord } from '@/lib/samples/credits'

export interface GrantInput {
  userId: string
  amountNGN: number
  reason: string
  expiresInDays?: number
}

/** Grant a sample credit to a customer. Administrative action, always audited. */
export async function grantSampleCredit(input: GrantInput, actorId: string) {
  if (!Number.isInteger(input.amountNGN) || input.amountNGN <= 0) {
    throw new AppError('VALIDATION_ERROR', { message: 'amountNGN must be a positive integer.' })
  }
  const expiresAt = input.expiresInDays && input.expiresInDays > 0
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null
  const credit = await prisma.sampleCredit.create({
    data: {
      userId: input.userId,
      amountNGN: input.amountNGN,
      remainingNGN: input.amountNGN,
      reason: input.reason.slice(0, 80),
      expiresAt,
    },
  })
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'sample_credit.grant', targetType: 'SampleCredit', targetId: credit.id, metadata: { userId: input.userId, amountNGN: input.amountNGN } })
  return credit
}

/**
 * Redeem sample credits against an order. Flag-gated. Applies oldest-expiring first and decrements
 * each credit's remaining balance atomically. The unique [creditId, orderId] constraint prevents the
 * same credit being redeemed twice for the same order.
 */
export async function redeemSampleCredits(userId: string, orderId: string, amountNGN: number) {
  if (!isFeatureEnabled('sample_credits')) throw new AppError('FEATURE_DISABLED', { message: 'Sample credit redemption is not currently enabled.' })

  return prisma.$transaction(async (tx) => {
    const rows = await tx.sampleCredit.findMany({
      where: { userId, remainingNGN: { gt: 0 } },
      select: { id: true, remainingNGN: true, expiresAt: true },
    })
    const credits: CreditRecord[] = rows.map((r) => ({ id: r.id, remainingNGN: r.remainingNGN, expiresAt: r.expiresAt?.toISOString() ?? null }))
    const application = applyCredits(credits, amountNGN)

    for (const b of application.breakdown) {
      await tx.creditRedemption.create({ data: { creditId: b.creditId, orderId, amountNGN: b.appliedNGN } })
      await tx.sampleCredit.update({ where: { id: b.creditId }, data: { remainingNGN: { decrement: b.appliedNGN } } })
    }
    await writeAudit({ actorId: userId, actorRole: 'USER', action: 'sample_credit.redeem', targetType: 'Order', targetId: orderId, metadata: { appliedNGN: application.totalAppliedNGN } })
    return application
  })
}

/**
 * Full-bottle conversion: when a customer converts a tried sample into a full-bottle purchase, grant
 * a credit equal to the sample price toward the full bottle. Idempotent per (user, sample product)
 * via the credit reason marker.
 */
export async function convertSampleToFullBottle(userId: string, sampleProductId: string, samplePriceNGN: number, actorId: string) {
  const marker = `full_bottle_conversion:${sampleProductId}`
  const existing = await prisma.sampleCredit.findFirst({ where: { userId, reason: marker } })
  if (existing) return { credit: existing, alreadyGranted: true }
  const credit = await grantSampleCredit({ userId, amountNGN: samplePriceNGN, reason: marker, expiresInDays: 90 }, actorId)
  return { credit, alreadyGranted: false }
}
