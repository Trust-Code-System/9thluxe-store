// lib/referrals/service.ts
// Referral attribution, qualification and reward approval. Reward PAYOUT is never automatic: it is
// routed through the Approval Centre and additionally gated by the `referral_rewards` flag. Basic
// fraud controls: no self-referral, one attribution per referred user, code must exist.
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import { createApproval } from '@/lib/approvals/service'
import { isValidReferralCode } from '@/lib/referrals/code'

export type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REVERSED'

/**
 * Attribute a newly-registered user to a referrer by code. Safe and idempotent: returns null when
 * the code is missing/invalid/self, or when the user was already attributed.
 */
export async function attributeReferral(referredUserId: string, code: string) {
  if (!code || !isValidReferralCode(code)) return null
  const normalized = code.toUpperCase()

  const referrer = await prisma.user.findUnique({ where: { referralCode: normalized }, select: { id: true } })
  if (!referrer) return null
  if (referrer.id === referredUserId) return null // no self-referral

  // One attribution per referred user.
  const already = await prisma.referral.findFirst({ where: { referredUserId } })
  if (already) return null

  const referral = await prisma.referral.create({
    data: { referrerId: referrer.id, referredUserId, code: `${normalized}-${referredUserId.slice(0, 8)}`, status: 'PENDING' },
  })
  await prisma.user.update({ where: { id: referredUserId }, data: { referredBy: referrer.id } }).catch(() => {})
  await writeAudit({ actorId: referredUserId, actorRole: 'USER', action: 'referral.attribute', targetType: 'Referral', targetId: referral.id, metadata: { referrerId: referrer.id } })
  return referral
}

/**
 * Mark a referral QUALIFIED once the referred user completes a qualifying (paid) order. Idempotent.
 */
export async function qualifyReferral(referredUserId: string, orderId: string) {
  const referral = await prisma.referral.findFirst({ where: { referredUserId, status: 'PENDING' } })
  if (!referral) return null
  const updated = await prisma.referral.update({ where: { id: referral.id }, data: { status: 'QUALIFIED' } })
  await writeAudit({ actorId: null, actorRole: 'SYSTEM', action: 'referral.qualify', targetType: 'Referral', targetId: referral.id, metadata: { orderId } })
  return updated
}

/**
 * Request a reward for a qualified referral. Never pays out directly; it creates an Approval Centre
 * record. Refused unless the `referral_rewards` flag is on AND the referral is QUALIFIED.
 */
export async function requestReferralReward(referralId: string, actorId: string) {
  if (!isFeatureEnabled('referral_rewards')) throw new AppError('FEATURE_DISABLED', { message: 'Referral rewards are not currently enabled.' })
  const referral = await prisma.referral.findUnique({ where: { id: referralId } })
  if (!referral) throw new AppError('NOT_FOUND')
  if (referral.status !== 'QUALIFIED') throw new AppError('VALIDATION_ERROR', { message: `Only QUALIFIED referrals can be rewarded (status ${referral.status}).` })
  if (referral.rewardApproved) throw new AppError('VALIDATION_ERROR', { message: 'Reward already approved.' })

  const approval = await createApproval({
    action: 'compensation',
    reason: `Referral reward for referral ${referral.id}`,
    dataSource: 'Referral',
    riskLevel: 'MEDIUM',
    createdBy: actorId,
    payload: { referralId: referral.id, referrerId: referral.referrerId },
  })
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'referral.reward_requested', targetType: 'Referral', targetId: referral.id, metadata: { approvalId: approval.id } })
  return { approval, referral }
}

/** Mark a referral reward as granted once its approval has been executed. */
export async function markReferralRewarded(referralId: string, actorId: string) {
  const referral = await prisma.referral.update({ where: { id: referralId }, data: { status: 'REWARDED', rewardApproved: true } })
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'referral.rewarded', targetType: 'Referral', targetId: referralId })
  return referral
}

/** Reverse a referral (fraud / chargeback). */
export async function reverseReferral(referralId: string, actorId: string) {
  const referral = await prisma.referral.update({ where: { id: referralId }, data: { status: 'REVERSED' } })
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'referral.reverse', targetType: 'Referral', targetId: referralId })
  return referral
}
