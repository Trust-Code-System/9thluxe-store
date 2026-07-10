import { describe, it, expect } from 'vitest'
import { validateDiscoverySet } from '@/lib/samples/discovery'
import { applyCredits, usableBalance } from '@/lib/samples/credits'

const item = (productId: string, quantity: number, unitPriceNGN = 3000) => ({
  productId,
  quantity,
  unitPriceNGN,
})

describe('discovery set — selection rules + pricing (config-driven min 3 / max 8)', () => {
  it('rejects fewer than the minimum', () => {
    const r = validateDiscoverySet([item('a', 1), item('b', 1)])
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/at least 3/)
  })
  it('rejects more than the maximum', () => {
    const r = validateDiscoverySet([item('a', 9)])
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/at most 8/)
  })
  it('accepts a valid set and prices it', () => {
    const r = validateDiscoverySet([item('a', 2, 3000), item('b', 2, 4000)])
    expect(r.ok).toBe(true)
    expect(r.totalItems).toBe(4)
    expect(r.subtotalNGN).toBe(2 * 3000 + 2 * 4000)
  })
})

describe('sample credits — application (expiry, no over-apply)', () => {
  const now = new Date('2026-07-10T00:00:00Z')

  it('applies expiring-soonest first and never exceeds the amount', () => {
    const credits = [
      { id: 'c1', remainingNGN: 5000, expiresAt: '2026-12-31' },
      { id: 'c2', remainingNGN: 5000, expiresAt: '2026-08-01' }, // sooner
    ]
    const r = applyCredits(credits, 6000, now)
    expect(r.totalAppliedNGN).toBe(6000)
    expect(r.remainingDueNGN).toBe(0)
    // c2 (sooner) consumed fully first
    expect(r.breakdown[0]).toEqual({ creditId: 'c2', appliedNGN: 5000 })
    expect(r.breakdown[1]).toEqual({ creditId: 'c1', appliedNGN: 1000 })
  })

  it('skips expired credits', () => {
    const credits = [{ id: 'old', remainingNGN: 9999, expiresAt: '2026-01-01' }]
    const r = applyCredits(credits, 5000, now)
    expect(r.totalAppliedNGN).toBe(0)
    expect(r.remainingDueNGN).toBe(5000)
    expect(usableBalance(credits, now)).toBe(0)
  })

  it('never applies more than remaining', () => {
    const credits = [{ id: 'c1', remainingNGN: 2000, expiresAt: null }]
    const r = applyCredits(credits, 10000, now)
    expect(r.totalAppliedNGN).toBe(2000)
    expect(r.remainingDueNGN).toBe(8000)
  })
})
