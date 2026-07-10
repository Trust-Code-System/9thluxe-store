import { describe, it, expect } from 'vitest'
import {
  checkUnsupportedCategory,
  checkMissingAttributes,
  checkInvalidCurrency,
  checkDuplicateSkus,
  checkOrphanedOrders,
  runAllChecks,
  type ProductRow,
} from '@/lib/migrate/checks'

const good: ProductRow = { id: '1', name: 'Noir', slug: 'noir', priceNGN: 50_000, currency: 'NGN', category: 'PERFUMES', sku: 'NOIR-100' }

describe('migration checks (dry-run validation, pure)', () => {
  it('flags unsupported (non-perfume) categories as BLOCK', () => {
    const issue = checkUnsupportedCategory([good, { ...good, id: '2', category: 'WATCHES' }])
    expect(issue?.level).toBe('BLOCK')
    expect(issue?.count).toBe(1)
  })

  it('flags missing required attributes', () => {
    expect(checkMissingAttributes([{ ...good, name: '' }])?.check).toBe('missing_attributes')
    expect(checkMissingAttributes([{ ...good, priceNGN: 0 }])?.count).toBe(1)
    expect(checkMissingAttributes([good])).toBeNull()
  })

  it('flags invalid currency', () => {
    expect(checkInvalidCurrency([{ ...good, currency: 'USD' }])?.check).toBe('invalid_currency')
    expect(checkInvalidCurrency([good])).toBeNull()
  })

  it('flags duplicate SKUs case-insensitively', () => {
    const issue = checkDuplicateSkus([good, { ...good, id: '2', sku: 'noir-100' }])
    expect(issue?.level).toBe('BLOCK')
  })

  it('ignores null SKUs for duplicate detection', () => {
    expect(checkDuplicateSkus([{ ...good, sku: null }, { ...good, id: '2', sku: null }])).toBeNull()
  })

  it('flags orphaned orders (missing customer)', () => {
    const issue = checkOrphanedOrders(['u1', 'u2', 'missing'], new Set(['u1', 'u2']))
    expect(issue?.level).toBe('BLOCK')
    expect(issue?.count).toBe(1)
  })

  it('runAllChecks passes clean data with no blocking issues', () => {
    const { issues, blocking } = runAllChecks({ products: [good], orderUserIds: ['u1'], existingUserIds: new Set(['u1']) })
    expect(issues).toHaveLength(0)
    expect(blocking).toBe(false)
  })

  it('runAllChecks reports blocking when a watch product remains', () => {
    const { blocking } = runAllChecks({
      products: [good, { ...good, id: '2', category: 'GLASSES' }],
      orderUserIds: [],
      existingUserIds: new Set(),
    })
    expect(blocking).toBe(true)
  })
})
