// integrations/payments/mock/index.ts
// Deterministic mock payment provider for development + tests. Never contacts a network.
// Success is simulated by reference prefix so tests can drive both branches.
import crypto from 'crypto'
import { AppError } from '@/lib/http/errors'
import { isSupportedCurrency } from '@/lib/config/commerce'
import type {
  PaymentProvider,
  InitPaymentInput,
  InitPaymentResult,
  VerifyPaymentResult,
  WebhookVerification,
} from '../types'

const MOCK_SECRET = 'mock_webhook_secret'

export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',

  async initialize(input: InitPaymentInput): Promise<InitPaymentResult> {
    if (!isSupportedCurrency(input.currency)) throw new AppError('CURRENCY_INVALID')
    if (!Number.isInteger(input.amountNGN) || input.amountNGN <= 0) {
      throw new AppError('VALIDATION_ERROR', { message: 'Invalid payment amount.' })
    }
    return {
      reference: input.reference,
      authorizationUrl: `https://mock-pay.local/checkout/${encodeURIComponent(input.reference)}`,
      accessCode: 'mock_access',
    }
  },

  async verify(reference, expected): Promise<VerifyPaymentResult> {
    // References starting with 'fail_' simulate failure; everything else succeeds.
    const success = !reference.startsWith('fail_')
    return {
      reference,
      status: success ? 'success' : 'failed',
      amountNGN: expected.amountNGN,
      currency: expected.currency,
      paidAt: success ? new Date().toISOString() : null,
      amountMatches: success,
    }
  },

  async refund(input) {
    if (!isSupportedCurrency(input.currency)) {
      throw new AppError('CURRENCY_INVALID')
    }
    if (!Number.isInteger(input.amountNGN) || input.amountNGN <= 0) {
      throw new AppError('VALIDATION_ERROR', {
        message: 'Invalid refund amount.',
      })
    }
    return {
      providerRefundId: `mock_refund_${input.reference}`,
      status: 'processing',
      amountNGN: input.amountNGN,
      currency: input.currency,
    }
  },

  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification {
    if (!signature) return { valid: false }
    const computed = crypto.createHmac('sha512', MOCK_SECRET).update(rawBody).digest('hex')
    const a = Buffer.from(computed)
    const b = Buffer.from(signature)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { valid: false }
    let evt: any
    try {
      evt = JSON.parse(rawBody)
    } catch {
      return { valid: false }
    }
    const data = evt?.data ?? {}
    return {
      valid: true,
      event: evt?.event,
      reference: data.reference,
      orderId: data?.metadata?.orderId,
      status: data.status === 'success' ? 'success' : 'pending',
      amountNGN: typeof data.amount === 'number' ? Math.round(data.amount / 100) : undefined,
      currency: data.currency,
    }
  },
}

/** Helper for tests: sign a mock webhook body. */
export function signMockWebhook(rawBody: string): string {
  return crypto.createHmac('sha512', MOCK_SECRET).update(rawBody).digest('hex')
}
