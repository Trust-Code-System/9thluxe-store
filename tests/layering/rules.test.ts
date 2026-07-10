import { describe, it, expect } from 'vitest'
import { evaluateLayering } from '@/lib/layering/rules'

describe('Layering Lab — editorial rules (guidance, deterministic)', () => {
  it('rates complementary pairs as great and orders base-heavier first', () => {
    const r = evaluateLayering(
      { name: 'Cedar Noir', family: 'WOODY' },
      { name: 'Oud Royale', family: 'ORIENTAL' },
    )
    expect(r.compatibility).toBe('great') // ORIENTAL|WOODY is a great pairing
    // ORIENTAL (weight 5) is heavier than WOODY (weight 4), so it sprays first.
    expect(r.sprayOrder[0]).toBe('Oud Royale')
    expect(r.isGuidance).toBe(true)
  })

  it('flags discouraged pairs and warns', () => {
    const r = evaluateLayering(
      { name: 'Aqua Fresh', family: 'FRESH' },
      { name: 'Sugar Bomb', family: 'GOURMAND' },
    )
    expect(r.compatibility).toBe('experimental')
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('warns when both are bold', () => {
    const r = evaluateLayering(
      { name: 'A', family: 'WOODY', intensity: 'bold' },
      { name: 'B', family: 'SPICY', intensity: 'bold' },
    )
    expect(r.warnings.some((w) => /bold/i.test(w))).toBe(true)
  })

  it('same family reinforces the theme', () => {
    const r = evaluateLayering({ name: 'A', family: 'FLORAL' }, { name: 'B', family: 'FLORAL' })
    expect(r.compatibility).toBe('good')
    expect(r.note).toMatch(/same family/i)
  })
})
