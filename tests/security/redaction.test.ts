import { describe, it, expect } from 'vitest'
import { scrubPrompt } from '@/integrations/ai'

describe('AI prompt PII redaction (no addresses/payment/contact leaves the server)', () => {
  it('redacts email addresses', () => {
    expect(scrubPrompt('reach me at jane.doe+test@example.com please')).not.toContain('example.com')
  })
  it('redacts 16-digit card numbers before phones', () => {
    const out = scrubPrompt('card 4111111111111111 now')
    expect(out).toContain('[card]')
    expect(out).not.toContain('4111111111111111')
  })
  it('redacts phone numbers', () => {
    const out = scrubPrompt('call +234 803 123 4567 today')
    expect(out).toContain('[phone]')
  })
  it('enforces an input ceiling', () => {
    expect(scrubPrompt('a'.repeat(10_000)).length).toBeLessThanOrEqual(6000)
  })
})
