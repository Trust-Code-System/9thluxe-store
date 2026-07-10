// lib/http/envelope.ts
// The single response envelope used by every /api/v1 route.
//   { data, error, meta, requestId }
import type { ErrorCode, FieldError } from './errors'

export interface EnvelopeError {
  code: ErrorCode
  message: string
  fieldErrors?: FieldError[]
}

export interface Envelope<T> {
  data: T | null
  error: EnvelopeError | null
  meta: Record<string, unknown>
  requestId: string
}

export function ok<T>(data: T, meta: Record<string, unknown> = {}, requestId = ''): Envelope<T> {
  return { data, error: null, meta, requestId }
}

export function fail(
  error: EnvelopeError,
  requestId = '',
  meta: Record<string, unknown> = {},
): Envelope<null> {
  return { data: null, error, meta, requestId }
}
