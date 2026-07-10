// integrations/payments/paystack/index.ts
// Paystack adapter. Test/sandbox keys only in this project — NEVER live charges.
import crypto from 'crypto'
import { AppError } from '@/lib/http/errors'
import { isSupportedCurrency } from '@/lib/config/commerce'
import { logger } from '@/lib/observability/logger'
import type {
  PaymentProvider,
  InitPaymentInput,
  InitPaymentResult,
  VerifyPaymentResult,
  WebhookVerification,
  PaymentStatus,
} from '../types'

const PAYSTACK_BASE = 'https://api.paystack.co'
const TIMEOUT_MS = 12_000

function secret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new AppError('PAYMENT_INIT_FAILED', { internal: 'PAYSTACK_SECRET_KEY missing' })
  return key
}

async function paystackFetch(path: string, init: RequestInit): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${PAYSTACK_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${secret()}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      // Normalize provider error; do NOT surface raw provider payload to customers.
      logger.warn('paystack_error', { status: res.status, path, providerMessage: body?.message })
      throw new AppError('PROVIDER_ERROR', { internal: { status: res.status, body } })
    }
    return body
  } catch (e) {
    if (e instanceof AppError) throw e
    if ((e as Error).name === 'AbortError') throw new AppError('PROVIDER_TIMEOUT', { internal: 'paystack timeout' })
    throw new AppError('PROVIDER_ERROR', { internal: e })
  } finally {
    clearTimeout(timer)
  }
}

function statusFromPaystack(s: string | undefined): PaymentStatus {
  switch (s) {
    case 'success':
      return 'success'
    case 'failed':
      return 'failed'
    case 'abandoned':
      return 'abandoned'
    default:
      return 'pending'
  }
}

export const paystackProvider: PaymentProvider = {
  name: 'paystack',

  async initialize(input: InitPaymentInput): Promise<InitPaymentResult> {
    if (!isSupportedCurrency(input.currency)) {
      throw new AppError('CURRENCY_INVALID')
    }
    if (!Number.isInteger(input.amountNGN) || input.amountNGN <= 0) {
      throw new AppError('VALIDATION_ERROR', { message: 'Invalid payment amount.' })
    }
    const body = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        amount: input.amountNGN * 100, // Paystack expects kobo
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: { ...input.metadata, orderId: input.orderId },
      }),
    })
    const data = body?.data
    if (!data?.authorization_url) throw new AppError('PAYMENT_INIT_FAILED')
    return {
      reference: data.reference ?? input.reference,
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
    }
  },

  async verify(reference, expected): Promise<VerifyPaymentResult> {
    const body = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    })
    const data = body?.data ?? {}
    const status = statusFromPaystack(data.status)
    const amountNGN = typeof data.amount === 'number' ? Math.round(data.amount / 100) : 0
    const currency = data.currency ?? expected.currency
    const amountMatches = amountNGN === expected.amountNGN && currency === expected.currency
    return {
      reference,
      status,
      amountNGN,
      currency,
      paidAt: data.paid_at ?? null,
      amountMatches,
    }
  },

  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification {
    if (!signature) return { valid: false }
    let computed: string
    try {
      computed = crypto.createHmac('sha512', secret()).update(rawBody).digest('hex')
    } catch {
      return { valid: false }
    }
    // Constant-time comparison to prevent timing attacks.
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
      status: statusFromPaystack(data.status),
      amountNGN: typeof data.amount === 'number' ? Math.round(data.amount / 100) : undefined,
      currency: data.currency,
    }
  },
}
