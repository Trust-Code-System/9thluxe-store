import { describe, it, expect } from 'vitest'
import { scoreCandidate, rankCandidates, type Candidate } from '@/lib/recommendations/scoring'

const base: Candidate = {
  id: 'p1',
  priceNGN: 80_000,
  inStock: true,
  fragranceFamily: 'WOODY',
  notes: ['oud', 'cedar', 'amber'],
  occasion: 'evening',
  climate: 'hot',
  intensity: 'strong',
  longevity: 'long',
  sampleAvailable: true,
}

describe('scoreCandidate — hard constraints disqualify', () => {
  it('over budget is disqualified', () => {
    const s = scoreCandidate(base, { budgetMaxNGN: 50_000 })
    expect(s.disqualified).toBe(true)
    expect(s.reasons).toContain('over_budget')
  })
  it('excluded note is disqualified even if otherwise perfect', () => {
    const s = scoreCandidate(base, { excludeNotes: ['oud'], family: 'WOODY', includeNotes: ['cedar'] })
    expect(s.disqualified).toBe(true)
    expect(s.reasons).toContain('excluded_note:oud')
  })
  it('out of stock is disqualified unless sample-first', () => {
    expect(scoreCandidate({ ...base, inStock: false }, {}).disqualified).toBe(true)
    expect(scoreCandidate({ ...base, inStock: false }, { preferSample: true }).disqualified).toBe(false)
  })
})

describe('scoreCandidate — soft scoring', () => {
  it('rewards family + note matches', () => {
    const s = scoreCandidate(base, { family: 'WOODY', includeNotes: ['oud', 'amber'] })
    expect(s.disqualified).toBe(false)
    expect(s.reasons).toContain('family_match')
    expect(s.score).toBeGreaterThan(30)
  })
  it('labels merchandising influence explicitly', () => {
    const s = scoreCandidate({ ...base, merchandisingWeight: 1 }, {})
    expect(s.merchandisingApplied).toBe(true)
    expect(s.reasons).toContain('merchandising_weight')
  })
})

describe('rankCandidates', () => {
  it('drops disqualified and orders by score', () => {
    const candidates: Candidate[] = [
      { ...base, id: 'a', priceNGN: 200_000 }, // over budget -> dropped
      { ...base, id: 'b', fragranceFamily: 'WOODY', notes: ['oud'] },
      { ...base, id: 'c', fragranceFamily: 'CITRUS', notes: ['lemon'] },
    ]
    const ranked = rankCandidates(candidates, { budgetMaxNGN: 100_000, family: 'WOODY', includeNotes: ['oud'] })
    expect(ranked.map((r) => r.id)).not.toContain('a')
    expect(ranked[0].id).toBe('b') // best family + note match ranks first
  })
})
