// lib/http/errors.ts
// Stable, machine-readable error catalogue for the /api/v1 surface.
//
// Every customer-facing error MUST originate from this catalogue so that:
//  - the code is stable and documented in contracts/error-catalogue.md
//  - the message is safe to show a customer (no secrets, no stack, no provider internals)
//  - the HTTP status is consistent
//
// Internal detail (provider responses, stack traces) is logged separately and NEVER returned.

export type ErrorCode =
  // Generic
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'REQUEST_TOO_LARGE'
  | 'METHOD_NOT_ALLOWED'
  | 'SERVICE_UNAVAILABLE'
  // Auth
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'REAUTH_REQUIRED'
  | 'CSRF_FAILED'
  // Catalogue / inventory
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  // Cart / checkout
  | 'CART_INVALID'
  | 'PRICE_MISMATCH'
  | 'TOTAL_MISMATCH'
  | 'CURRENCY_INVALID'
  // Coupons / promotions
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'COUPON_LIMIT_REACHED'
  | 'COUPON_MIN_SUBTOTAL'
  // Payments
  | 'PAYMENT_INIT_FAILED'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'PAYMENT_ALREADY_PROCESSED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_REPLAY'
  // Reviews
  | 'REVIEW_NOT_VERIFIED'
  | 'REVIEW_DUPLICATE'
  // AI / concierge
  | 'AI_UNAVAILABLE'
  | 'AI_OUTPUT_INVALID'
  | 'AI_REQUEST_UNSUPPORTED'
  // Provider / integration
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'FEATURE_DISABLED'

interface ErrorSpec {
  status: number
  /** Safe, customer-facing default message. Callers may override with an equally-safe message. */
  message: string
}

export const ERROR_CATALOGUE: Record<ErrorCode, ErrorSpec> = {
  INTERNAL_ERROR: { status: 500, message: 'Something went wrong. Please try again.' },
  VALIDATION_ERROR: { status: 400, message: 'Some of the information provided is invalid.' },
  NOT_FOUND: { status: 404, message: 'The requested resource was not found.' },
  RATE_LIMITED: { status: 429, message: 'Too many requests. Please slow down and try again shortly.' },
  REQUEST_TOO_LARGE: { status: 413, message: 'The request is too large.' },
  METHOD_NOT_ALLOWED: { status: 405, message: 'That method is not allowed here.' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'This service is temporarily unavailable.' },

  UNAUTHENTICATED: { status: 401, message: 'Please sign in to continue.' },
  FORBIDDEN: { status: 403, message: 'You do not have permission to do that.' },
  REAUTH_REQUIRED: { status: 401, message: 'Please confirm your password to continue.' },
  CSRF_FAILED: { status: 403, message: 'Your session could not be verified. Please refresh and retry.' },

  PRODUCT_NOT_FOUND: { status: 404, message: 'That product could not be found.' },
  PRODUCT_UNAVAILABLE: { status: 409, message: 'That product is not currently available.' },
  OUT_OF_STOCK: { status: 409, message: 'That product is out of stock.' },
  INSUFFICIENT_STOCK: { status: 409, message: 'There is not enough stock for the requested quantity.' },

  CART_INVALID: { status: 400, message: 'Your cart could not be processed. Please review it and retry.' },
  PRICE_MISMATCH: { status: 409, message: 'A price changed. Please refresh your cart and retry.' },
  TOTAL_MISMATCH: { status: 409, message: 'Your order total did not match. Please refresh and retry.' },
  CURRENCY_INVALID: { status: 400, message: 'That currency is not supported.' },

  COUPON_INVALID: { status: 400, message: 'That promo code is not valid.' },
  COUPON_EXPIRED: { status: 400, message: 'That promo code has expired.' },
  COUPON_LIMIT_REACHED: { status: 400, message: 'That promo code has reached its usage limit.' },
  COUPON_MIN_SUBTOTAL: { status: 400, message: 'Your order does not meet the minimum for this promo code.' },

  PAYMENT_INIT_FAILED: { status: 502, message: 'We could not start your payment. Please try again.' },
  PAYMENT_VERIFICATION_FAILED: { status: 402, message: 'Your payment could not be verified.' },
  PAYMENT_ALREADY_PROCESSED: { status: 409, message: 'This payment has already been processed.' },
  WEBHOOK_SIGNATURE_INVALID: { status: 401, message: 'Signature verification failed.' },
  WEBHOOK_REPLAY: { status: 409, message: 'This event was already received.' },

  REVIEW_NOT_VERIFIED: { status: 403, message: 'Only verified purchasers can review this product.' },
  REVIEW_DUPLICATE: { status: 409, message: 'You have already reviewed this product.' },

  AI_UNAVAILABLE: { status: 503, message: 'The concierge is briefly unavailable. Please try again.' },
  AI_OUTPUT_INVALID: { status: 502, message: 'The concierge could not complete that request.' },
  AI_REQUEST_UNSUPPORTED: { status: 422, message: 'The concierge can only help with our fragrance catalogue.' },

  PROVIDER_ERROR: { status: 502, message: 'An upstream service returned an error. Please try again.' },
  PROVIDER_TIMEOUT: { status: 504, message: 'An upstream service timed out. Please try again.' },
  FEATURE_DISABLED: { status: 403, message: 'That feature is not currently enabled.' },
}

export interface FieldError {
  field: string
  message: string
}

/**
 * Application error carrying a stable catalogue code. Throw this anywhere in a request
 * lifecycle; `handler.ts` converts it into a safe envelope response.
 */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly safeMessage: string
  readonly fieldErrors?: FieldError[]
  /** Internal-only context for logs. Never serialized to the client. */
  readonly internal?: unknown

  constructor(
    code: ErrorCode,
    options?: { message?: string; fieldErrors?: FieldError[]; internal?: unknown },
  ) {
    const spec = ERROR_CATALOGUE[code]
    super(options?.message ?? spec.message)
    this.name = 'AppError'
    this.code = code
    this.status = spec.status
    this.safeMessage = options?.message ?? spec.message
    this.fieldErrors = options?.fieldErrors
    this.internal = options?.internal
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError
}
