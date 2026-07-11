// lib/loyalty/service.ts
// DB-touching loyalty operations: redemption (financial, flag-gated), reversal (on refund), and
// expiration. Earning itself is wired into the Paystack webhook. Every mutation is atomic and
// audited. Financial rewards (redemption) refuse unless the `loyalty_rewards` flag is on.
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { validateRedemption } from '@/lib/loyalty/points'

/** Current points balance for a user (earn = +, redeem/reverse = -). Never negative. */
export async function getPointsBalance(userId: string): Promise<number> {
  const agg = await prisma.loyaltyLedger.aggregate({ where: { userId }, _sum: { delta: true } })
  return Math.max(0, agg._sum.delta ?? 0)
}

/**
 * Redeem points. Financial action; refused unless the `loyalty_rewards` flag is enabled. Records a
 * negative ledger entry atomically so concurrent redemptions cannot overspend.
 */
export async function redeemPoints(userId: string, points: number, orderId?: string) {
  const enabled = isFeatureEnabled('loyalty_rewards')

  return prisma.$transaction(async (tx) => {
    const agg = await tx.loyaltyLedger.aggregate({ where: { userId }, _sum: { delta: true } })
    const balance = Math.max(0, agg._sum.delta ?? 0)
    const check = validateRedemption(balance, points, enabled)
    if (!check.ok) {
      if (check.reason === 'rewards_disabled') throw new AppError('FEATURE_DISABLED', { message: 'Points redemption is not currently enabled.' })
      throw new AppError('VALIDATION_ERROR', { message: check.reason === 'insufficient_balance' ? 'You do not have enough points.' : 'Invalid redemption amount.' })
    }
    const balanceAfter = balance - check.points
    const entry = await tx.loyaltyLedger.create({
      data: { userId, delta: -check.points, reason: 'redeem', balanceAfter, orderId: orderId ?? null },
    })
    await writeAudit({ actorId: userId, actorRole: 'USER', action: 'loyalty.redeem', targetType: 'LoyaltyLedger', targetId: entry.id, metadata: { points: check.points, orderId } })
    return { entry, balanceAfter, points: check.points }
  })
}

/**
 * Reverse points earned for an order (e.g. after a refund). Idempotent: if a reversal for the order
 * already exists, it is a no-op. Balance is never driven below zero.
 */
export async function reversePointsForOrder(userId: string, orderId: string) {
  return prisma.$transaction(async (tx) => {
    const existingReversal = await tx.loyaltyLedger.findFirst({ where: { userId, orderId, reason: 'order_reversal' } })
    if (existingReversal) return { reversed: 0, alreadyReversed: true }

    const earned = await tx.loyaltyLedger.aggregate({ where: { userId, orderId, reason: 'order_earn' }, _sum: { delta: true } })
    const earnedPoints = earned._sum.delta ?? 0
    if (earnedPoints <= 0) return { reversed: 0, alreadyReversed: false }

    const agg = await tx.loyaltyLedger.aggregate({ where: { userId }, _sum: { delta: true } })
    const balance = Math.max(0, agg._sum.delta ?? 0)
    const reversal = Math.min(earnedPoints, balance)
    const balanceAfter = balance - reversal
    const entry = await tx.loyaltyLedger.create({
      data: { userId, delta: -reversal, reason: 'order_reversal', balanceAfter, orderId },
    })
    await writeAudit({ actorId: null, actorRole: 'SYSTEM', action: 'loyalty.reverse', targetType: 'LoyaltyLedger', targetId: entry.id, metadata: { orderId, reversed: reversal } })
    return { reversed: reversal, alreadyReversed: false }
  })
}

/**
 * Grant points as an administrative adjustment (e.g. goodwill). Always allowed for staff, always
 * audited. Uses a positive or negative delta.
 */
export async function adjustPoints(userId: string, delta: number, reason: string, actorId: string) {
  if (!Number.isInteger(delta) || delta === 0) throw new AppError('VALIDATION_ERROR', { message: 'delta must be a non-zero integer.' })
  return prisma.$transaction(async (tx) => {
    const agg = await tx.loyaltyLedger.aggregate({ where: { userId }, _sum: { delta: true } })
    const balance = Math.max(0, agg._sum.delta ?? 0)
    const balanceAfter = Math.max(0, balance + delta)
    const entry = await tx.loyaltyLedger.create({
      data: { userId, delta, reason: `adjust:${reason}`.slice(0, 60), balanceAfter },
    })
    await writeAudit({ actorId, actorRole: 'ADMIN', action: 'loyalty.adjust', targetType: 'LoyaltyLedger', targetId: entry.id, metadata: { userId, delta, reason } })
    return { entry, balanceAfter }
  })
}
