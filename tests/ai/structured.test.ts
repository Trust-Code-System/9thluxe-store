import { describe, it, expect } from 'vitest'
import { aiServices, scrubPrompt } from '@/integrations/ai'

describe('AI structured output (mock provider, schema-validated)', () => {
  it('classifyIntent extracts budget, include/exclude notes as valid JSON', async () => {
    const r = await aiServices.classifyIntent({ message: 'I want oud under 100000 but no vanilla' })
    expect(r.includeNotes).toContain('oud')
    expect(r.excludeNotes).toContain('vanilla')
    expect(r.budgetMaxNGN).toBe(100000)
    expect([
      'recommend',
      'compare',
      'gift',
      'layering',
      'similar',
      'sample_first',
      'support',
      'unsupported',
    ]).toContain(r.intent)
  })

  it('summarizeReviews reports the number summarized and flags it as an AI summary', async () => {
    const r = await aiServices.summarizeReviews({
      productName: 'Nocturne',
      reviews: [
        { rating: 5, comment: 'lasts all day' },
        { rating: 4, comment: 'nice projection' },
      ],
    })
    expect(r.reviewsSummarized).toBe(2)
    expect(r.isAiSummary).toBe(true)
    expect(typeof r.summary).toBe('string')
  })
})

describe('prompt PII redaction (nothing sensitive leaves the server)', () => {
  it('masks email, phone, and card-like numbers', () => {
    const out = scrubPrompt('email me at a@b.com or +2348012345678, card 4111111111111111')
    expect(out).not.toContain('a@b.com')
    expect(out).not.toContain('4111111111111111')
    expect(out).toContain('[email]')
    expect(out).toContain('[card]')
  })
})
