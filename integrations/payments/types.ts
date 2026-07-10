// integrations/payments/types.ts
// Isolated payment-provider interface. No business route calls Paystack directly.
//
// Invariants enforced by every adapter:
//  - amount + currency are validated before initialization
//  - transaction reference is unique per order
//  - success is ONLY ever asserted from a server-side verification or a verified webhook,
//    never from a browser redirect
//  - webhook signatures are verified with constant-time comparison
//  - card data is never stored or logged

export interface InitPaymentInput {
  orderId: string
  reference: string // unique per order
  amountNGN: number // whole naira; adapter converts to provider minor units
  currency: string // must be a supported currency
  email: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface InitPaymentResult {
  reference: string
  /** Provider-hosted checkout/authorization URL the storefront redirects to. */
  authorizationUrl: string
  accessCode?: string
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned'

export interface VerifyPaymentResult {
  reference: string
  status: PaymentStatus
  amountNGN: number
  currency: string
  paidAt: string | null
  /** Whether the verified amount/currency matched what we expected. */
  amountMatches: boolean
}

export interface WebhookVerification {
  valid: boolean
  event?: string
  reference?: string
  orderId?: string
  status?: PaymentStatus
  amountNGN?: number
  currency?: string
}

export interface PaymentProvider {
  readonly name: 'paystack' | 'mock'
  /** Validate + initialize a payment. Throws AppError('CURRENCY_INVALID'|'PAYMENT_INIT_FAILED'). */
  initialize(input: InitPaymentInput): Promise<InitPaymentResult>
  /** Server-side verification. The ONLY authoritative source of 'paid'. */
  verify(reference: string, expected: { amountNGN: number; currency: string }): Promise<VerifyPaymentResult>
  /** Verify a raw webhook body + signature and normalize it. Constant-time comparison. */
  verifyWebhook(rawBody: string, signature: string | null): WebhookVerification
}
