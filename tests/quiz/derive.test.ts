import { describe, it, expect } from 'vitest'
import { deriveProfile, answersSchema } from '@/lib/quiz/definition'
import { checkDeliveryFeasibility } from '@/lib/gift/feasibility'

describe('Fragrance DNA — profile derivation (pure, preferences only)', () => {
  it('derives families, notes, budget, and archetype from answers', () => {
    const answers = answersSchema.parse({
      families: ['WOODY', 'ORIENTAL'],
      intensity: 'bold',
      loveNotes: ['oud', 'amber'],
      avoidNotes: ['rose'],
      occasion: 'evening',
      climate: 'hot',
      budget: '100_200',
    })
    const p = deriveProfile(answers)
    expect(p.preferredFamilies).toEqual(['WOODY', 'ORIENTAL'])
    expect(p.preferredNotes).toContain('oud')
    expect(p.dislikedNotes).toContain('rose')
    expect(p.budgetMaxNGN).toBe(200_000)
    expect(p.intensity).toBe('bold')
    expect(p.archetype).toBe('The Connoisseur') // dominant family WOODY
  })

  it('falls back to a default archetype with no families', () => {
    const p = deriveProfile(answersSchema.parse({}))
    expect(p.archetype).toBe('The Explorer')
    expect(p.budgetMaxNGN).toBeNull()
  })

  it('only infers fragrance preferences (no sensitive personal fields present)', () => {
    const p = deriveProfile(answersSchema.parse({ families: ['FRESH'] }))
    expect(Object.keys(p).sort()).toEqual(
      ['archetype', 'budgetMaxNGN', 'climate', 'dislikedNotes', 'intensity', 'occasion', 'preferredFamilies', 'preferredNotes'].sort(),
    )
  })
})

describe('Gift Concierge — delivery feasibility (separate from AI)', () => {
  const now = new Date('2026-07-10T00:00:00.000Z')

  it('is feasible when the deadline is comfortably after the estimate', () => {
    const r = checkDeliveryFeasibility({ deadlineISO: '2026-07-30', now })
    expect(r.hasDeadline).toBe(true)
    expect(r.feasible).toBe(true)
  })

  it('is at risk when the deadline is sooner than processing + delivery', () => {
    const r = checkDeliveryFeasibility({ deadlineISO: '2026-07-11', now })
    expect(r.feasible).toBe(false)
    expect(r.message).toMatch(/at risk/i)
  })

  it('is unconstrained with no deadline', () => {
    const r = checkDeliveryFeasibility({ now })
    expect(r.hasDeadline).toBe(false)
    expect(r.feasible).toBe(true)
  })
})
