import { describe, it, expect } from 'vitest'
import { paymentFee, computeMargin, DEFAULT_FEE_MODEL } from '@/lib/copilot/margin'

describe('margin assistant — payment fee model', () => {
  it('waives the flat fee below the threshold', () => {
    // 1,000 * 1.5% = 15, flat waived under 2,500 => 15
    expect(paymentFee(1_000)).toBe(15)
  })
  it('adds the flat fee at/above the threshold', () => {
    // 10,000 * 1.5% = 150 + 100 flat = 250
    expect(paymentFee(10_000)).toBe(250)
  })
  it('caps the fee', () => {
    expect(paymentFee(10_000_000)).toBe(DEFAULT_FEE_MODEL.cap)
  })
  it('is zero for non-positive amounts', () => {
    expect(paymentFee(0)).toBe(0)
    expect(paymentFee(-5)).toBe(0)
  })
})

describe('margin assistant — margin computation (never fabricated)', () => {
  it('reports insufficient data when COGS is unknown', () => {
    const r = computeMargin({ revenueNGN: 100_000, cogsNGN: null, paymentFeeNGN: 250, shippingSubsidyNGN: 0, discountNGN: 0, refundNGN: 0 })
    expect(r.costDataAvailable).toBe(false)
    expect(r.grossMarginNGN).toBeNull()
    expect(r.reason).toBe('no_cost_price_data')
  })
  it('computes gross + contribution margin when cost is known', () => {
    const r = computeMargin({ revenueNGN: 100_000, cogsNGN: 40_000, paymentFeeNGN: 1_600, shippingSubsidyNGN: 2_500, discountNGN: 10_000, refundNGN: 0 })
    // net revenue = 90,000; gross = 50,000; contribution = 50,000 - 1,600 - 2,500 = 45,900
    expect(r.grossMarginNGN).toBe(50_000)
    expect(r.contributionMarginNGN).toBe(45_900)
    expect(r.grossMarginPct).toBeCloseTo(55.6, 1)
  })
})
