import { describe, it, expect, beforeEach } from 'vitest'
import { consumeRateLimit, clientIp, __resetRateLimiter, rateLimiterBackend } from '@/lib/middleware/limiter'

describe('rate limiter (durable abstraction, in-memory default)', () => {
  beforeEach(() => __resetRateLimiter())

  it('defaults to the in-memory backend without Upstash config', () => {
    expect(rateLimiterBackend()).toBe('memory')
  })

  it('allows up to the limit then blocks within the window', async () => {
    const id = 'test:1.2.3.4'
    for (let i = 0; i < 3; i++) {
      const r = await consumeRateLimit(id, 3, 1000)
      expect(r.ok).toBe(true)
    }
    const blocked = await consumeRateLimit(id, 3, 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('tracks separate identifiers independently', async () => {
    const a = await consumeRateLimit('scope:a', 1, 1000)
    const b = await consumeRateLimit('scope:b', 1, 1000)
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
  })

  it('extracts the first x-forwarded-for hop', () => {
    const req = { headers: { get: (n: string) => (n === 'x-forwarded-for' ? '9.9.9.9, 10.0.0.1' : null) } }
    expect(clientIp(req)).toBe('9.9.9.9')
  })
})
