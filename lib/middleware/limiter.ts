// lib/middleware/limiter.ts
// Rate-limiter abstraction with a pluggable store. Fixed-window counters.
//  - Default: in-memory (per serverless instance). Correct for single-instance/dev; on multi-instance
//    serverless it under-counts across instances; a documented limitation.
//  - Durable: Upstash Redis REST store (fetch-based, no extra dependency) when UPSTASH_REDIS_REST_URL
//    + UPSTASH_REDIS_REST_TOKEN are set. This gives cross-instance durable limiting.
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'

export interface RateLimitResult {
  ok: boolean
  remaining: number
  limit: number
  resetMs: number
}

interface RateLimitStore {
  readonly name: string
  incr(key: string, windowMs: number): Promise<{ count: number; resetMs: number }>
}

// --- In-memory store ---
const mem = new Map<string, { count: number; resetAt: number }>()
const memoryStore: RateLimitStore = {
  name: 'memory',
  async incr(key: string, windowMs: number) {
    const now = Date.now()
    const rec = mem.get(key)
    if (!rec || now > rec.resetAt) {
      const resetAt = now + windowMs
      mem.set(key, { count: 1, resetAt })
      return { count: 1, resetMs: resetAt - now }
    }
    rec.count++
    return { count: rec.count, resetMs: rec.resetAt - now }
  },
}

// --- Upstash Redis REST store (durable) ---
function upstashStore(): RateLimitStore | null {
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return {
    name: 'upstash',
    async incr(key: string, windowMs: number) {
      const seconds = Math.ceil(windowMs / 1000)
      // Pipeline: INCR then EXPIRE (NX so the window isn't extended on each hit).
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(seconds), 'NX'],
          ['PTTL', key],
        ]),
      })
      if (!res.ok) throw new Error(`upstash ${res.status}`)
      const out = (await res.json()) as Array<{ result: number }>
      const count = Number(out[0]?.result ?? 1)
      const pttl = Number(out[2]?.result ?? windowMs)
      return { count, resetMs: pttl > 0 ? pttl : windowMs }
    },
  }
}

let selected: RateLimitStore | null = null
function store(): RateLimitStore {
  if (selected) return selected
  selected = upstashStore() ?? memoryStore
  return selected
}

/**
 * Consume one request against a fixed-window limit. Fails OPEN (allows the request) if the durable
 * store errors, so a limiter outage never takes down the API; the error is logged.
 */
export async function consumeRateLimit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const key = `rl:${identifier}`
  try {
    const { count, resetMs } = await store().incr(key, windowMs)
    return { ok: count <= limit, remaining: Math.max(0, limit - count), limit, resetMs }
  } catch (e) {
    logger.warn('rate_limit_store_error', { store: store().name, internal: String(e) })
    return { ok: true, remaining: limit, limit, resetMs: windowMs }
  }
}

export function rateLimiterBackend(): string {
  return store().name
}

/** Best-effort client identifier from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Enforce a rate limit for a request, throwing AppError('RATE_LIMITED') when exceeded. Import lazily
 * to avoid a circular dependency with the error module at load time.
 */
export async function enforceRateLimit(
  req: { headers: { get(name: string): string | null } },
  scope: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const result = await consumeRateLimit(`${scope}:${clientIp(req)}`, limit, windowMs)
  if (!result.ok) {
    const { AppError } = await import('@/lib/http/errors')
    throw new AppError('RATE_LIMITED')
  }
}

/** For tests: clear in-memory counters + re-select the store. */
export function __resetRateLimiter() {
  mem.clear()
  selected = null
}
