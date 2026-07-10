// lib/env.ts
// Central, Zod-validated environment access. Import `env` instead of reading process.env
// directly so that missing/invalid config fails loudly in development and is documented.
//
// Design notes:
//  - Almost everything is optional so the app boots in dev with mock providers.
//  - `assertServerEnv()` can be called from a startup/health route to surface problems.
//  - We never print secret values, only which keys are missing/invalid.
import { z } from 'zod'

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Core
  DATABASE_URL: z.string().url().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // Auth
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Payments (Paystack) — sandbox/test only in this project
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  NEWSLETTER_FROM_EMAIL: z.string().optional(),

  // Shopify (all optional; adapter degrades to local commerce when absent)
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_STOREFRONT_API_TOKEN: z.string().optional(),
  SHOPIFY_ADMIN_API_TOKEN: z.string().optional(),
  SHOPIFY_API_VERSION: z.string().default('2025-01'),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),

  // AI providers (default provider = mock)
  AI_PROVIDER: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),

  // Messaging
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  // Commerce configuration (overrides lib/config/commerce.ts defaults)
  COMMERCE_CURRENCY: z.string().default('NGN'),
  COMMERCE_FREE_SHIPPING_THRESHOLD_NGN: z.coerce.number().int().nonnegative().default(500_000),
  COMMERCE_FLAT_SHIPPING_NGN: z.coerce.number().int().nonnegative().default(2_500),

  // Feature flags (comma-separated list of enabled flags)
  FEATURE_FLAGS: z.string().default(''),
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    // Do not print values. Only the offending keys.
    const keys = parsed.error.errors.map((e) => e.path.join('.')).join(', ')
    // In production we still boot with defaults where possible, but log loudly.
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ level: 'error', message: 'env_validation_failed', keys }))
      cached = schema.parse({ ...process.env, NODE_ENV: 'production' })
      return cached
    }
    throw new Error(`Environment validation failed for: ${keys}`)
  }
  cached = parsed.data
  return cached
}

export const env = new Proxy({} as Env, {
  get: (_t, prop: string) => getEnv()[prop as keyof Env],
})

/** Returns a report of which optional integrations are configured. Safe to expose to admins. */
export function integrationStatus() {
  const e = getEnv()
  return {
    database: Boolean(e.DATABASE_URL),
    auth: Boolean(e.AUTH_SECRET || e.NEXTAUTH_SECRET),
    paystack: Boolean(e.PAYSTACK_SECRET_KEY),
    resend: Boolean(e.RESEND_API_KEY),
    shopify: Boolean(e.SHOPIFY_STORE_DOMAIN && e.SHOPIFY_STOREFRONT_API_TOKEN),
    shopifyAdmin: Boolean(e.SHOPIFY_ADMIN_API_TOKEN),
    ai: e.AI_PROVIDER,
    aiKeyPresent:
      e.AI_PROVIDER === 'mock' ||
      (e.AI_PROVIDER === 'anthropic' && Boolean(e.ANTHROPIC_API_KEY)) ||
      (e.AI_PROVIDER === 'openai' && Boolean(e.OPENAI_API_KEY)),
    whatsapp: Boolean(e.WHATSAPP_TOKEN && e.WHATSAPP_PHONE_ID),
    sms: Boolean(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN),
  }
}
