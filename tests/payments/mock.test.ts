import { describe, it, expect } from 'vitest'
import { mockPaymentProvider, signMockWebhook } from '@/integrations/payments/mock'

const expected = { amountNGN: 95_000, currency: 'NGN' }

describe('payment provider — server-side verification is authoritative', () => {
  it('verifies a successful reference and confirms amount match', async () => {
    const r = await mockPaymentProvider.verify('ref_ok_123', expected)
    expect(r.status).toBe('success')
    expect(r.amountMatches).toBe(true)
  })

  it('reports failure for a fail_ reference', async () => {
    const r = await mockPaymentProvider.verify('fail_ref_1', expected)
    expect(r.status).toBe('failed')
    expect(r.amountMatches).toBe(false)
  })

  it('rejects unsupported currency at init', async () => {
    await expect(
      mockPaymentProvider.initialize({
        orderId: 'o1',
        reference: 'r1',
        amountNGN: 1000,
        currency: 'USD',
        email: 'x@example.com',
      }),
    ).rejects.toMatchObject({ code: 'CURRENCY_INVALID' })
  })
})

describe('webhook signature verification', () => {
  const body = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'r1', status: 'success', amount: 9_500_000, currency: 'NGN', metadata: { orderId: 'o1' } },
  })

  it('accepts a correctly signed body and normalizes it', () => {
    const sig = signMockWebhook(body)
    const v = mockPaymentProvider.verifyWebhook(body, sig)
    expect(v.valid).toBe(true)
    expect(v.orderId).toBe('o1')
    expect(v.amountNGN).toBe(95_000)
  })

  it('rejects a tampered body', () => {
    const sig = signMockWebhook(body)
    const tampered = body.replace('95', '99')
    expect(mockPaymentProvider.verifyWebhook(tampered, sig).valid).toBe(false)
  })

  it('rejects a missing signature', () => {
    expect(mockPaymentProvider.verifyWebhook(body, null).valid).toBe(false)
  })
})
