import { describe, it, expect } from 'vitest'
import { pointsForOrder, computeBalance, validateRedemption } from '@/lib/loyalty/points'
import { isValidReferralCode, generateReferralCode } from '@/lib/referrals/code'

describe('loyalty points (earn deterministic, redeem gated)', () => {
  it('earns 1 point per ₦1,000, floored', () => {
    expect(pointsForOrder(95_000)).toBe(95)
    expect(pointsForOrder(999)).toBe(0)
    expect(pointsForOrder(-5)).toBe(0)
  })
  it('computes a non-negative balance', () => {
    expect(computeBalance([{ delta: 100 }, { delta: -30 }])).toBe(70)
    expect(computeBalance([{ delta: -100 }])).toBe(0)
  })
  it('refuses redemption when rewards are disabled, regardless of balance', () => {
    expect(validateRedemption(500, 100, false)).toEqual({ ok: false, reason: 'rewards_disabled', points: 0 })
  })
  it('allows redemption up to balance when enabled', () => {
    expect(validateRedemption(500, 100, true)).toEqual({ ok: true, points: 100 })
    expect(validateRedemption(500, 600, true).ok).toBe(false)
  })
})

describe('referral codes', () => {
  it('generates unambiguous, valid codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateReferralCode()
      expect(isValidReferralCode(code)).toBe(true)
      expect(code).not.toMatch(/[O0I1]/)
    }
  })
})
