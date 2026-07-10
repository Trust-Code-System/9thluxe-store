import { describe, it, expect } from 'vitest'
import { AppError, ERROR_CATALOGUE, isAppError } from '@/lib/http/errors'
import { ok, fail } from '@/lib/http/envelope'

describe('error catalogue', () => {
  it('every code has a status and a non-empty safe message', () => {
    for (const [code, spec] of Object.entries(ERROR_CATALOGUE)) {
      expect(spec.status, code).toBeGreaterThanOrEqual(400)
      expect(spec.message.length, code).toBeGreaterThan(0)
      // Safe message must not leak stack/secret markers
      expect(spec.message.toLowerCase()).not.toContain('stack')
    }
  })

  it('AppError carries the catalogue status + safe message', () => {
    const e = new AppError('COUPON_EXPIRED')
    expect(e.status).toBe(400)
    expect(e.safeMessage).toBe('That promo code has expired.')
    expect(isAppError(e)).toBe(true)
  })

  it('AppError supports field errors and an internal-only payload', () => {
    const e = new AppError('VALIDATION_ERROR', {
      fieldErrors: [{ field: 'email', message: 'Required' }],
      internal: { secret: 'do-not-leak' },
    })
    expect(e.fieldErrors).toHaveLength(1)
    // internal is not part of the safe surface
    expect(JSON.stringify({ code: e.code, message: e.safeMessage, fieldErrors: e.fieldErrors })).not.toContain(
      'do-not-leak',
    )
  })
})

describe('envelope', () => {
  it('ok() shape', () => {
    const env = ok({ x: 1 }, { total: 1 }, 'req_1')
    expect(env).toEqual({ data: { x: 1 }, error: null, meta: { total: 1 }, requestId: 'req_1' })
  })
  it('fail() shape', () => {
    const env = fail({ code: 'NOT_FOUND', message: 'nope' }, 'req_2')
    expect(env.data).toBeNull()
    expect(env.error?.code).toBe('NOT_FOUND')
    expect(env.requestId).toBe('req_2')
  })
})
