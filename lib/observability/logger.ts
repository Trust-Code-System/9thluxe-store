// lib/observability/logger.ts
// Structured, secret-safe logger. Emits single-line JSON so it can be ingested by any
// log platform. NEVER logs secrets, full payment payloads, raw card data, or full PII.

type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'authorization',
  'cookie',
  'secret',
  'token',
  'apikey',
  'api_key',
  'card',
  'cardnumber',
  'cvv',
  'pan',
  'access_token',
  'refresh_token',
  'id_token',
  'paystack_secret_key',
]

const EMAIL_RE = /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*(@[^\s]+)/g

/** Redact sensitive keys and mask emails recursively. Bounded depth to avoid cycles. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]'
  if (value == null) return value
  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, (_m, a, b) => `${a}***${b}`)
  }
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
      out[k] = '[redacted]'
    } else {
      out[k] = redact(v, depth + 1)
    }
  }
  return out
}

export interface LogContext {
  requestId?: string
  route?: string
  userId?: string
  correlationId?: string
  [k: string]: unknown
}

function emit(level: Level, message: string, context: LogContext = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(redact(context) as Record<string, unknown>),
  }
  const serialized = JSON.stringify(line)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else if (level === 'debug') {
    if (process.env.NODE_ENV !== 'production') console.debug(serialized)
  } else console.log(serialized)
}

export const logger = {
  debug: (m: string, c?: LogContext) => emit('debug', m, c),
  info: (m: string, c?: LogContext) => emit('info', m, c),
  warn: (m: string, c?: LogContext) => emit('warn', m, c),
  error: (m: string, c?: LogContext) => emit('error', m, c),
}
