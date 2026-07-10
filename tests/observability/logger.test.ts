import { describe, it, expect } from 'vitest'
import { redact } from '@/lib/observability/logger'

describe('log redaction (no secrets / PII in logs)', () => {
  it('redacts sensitive keys', () => {
    const out = redact({ password: 'hunter2', passwordHash: 'abc', token: 't', nested: { apiKey: 'k' } }) as any
    expect(out.password).toBe('[redacted]')
    expect(out.passwordHash).toBe('[redacted]')
    expect(out.token).toBe('[redacted]')
    expect(out.nested.apiKey).toBe('[redacted]')
  })

  it('masks emails inside strings', () => {
    const out = redact({ note: 'contact jane@example.com now' }) as any
    expect(out.note).not.toContain('jane@example.com')
    expect(out.note).toContain('***')
  })

  it('bounds recursion depth', () => {
    const deep: any = {}
    let cur = deep
    for (let i = 0; i < 12; i++) {
      cur.next = {}
      cur = cur.next
    }
    expect(() => redact(deep)).not.toThrow()
  })
})
