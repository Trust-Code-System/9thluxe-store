// lib/config/feature-flags.ts
// Simple env-driven feature flags. Financial-reward features stay OFF until the owner approves.
import { env } from '@/lib/env'

export type FeatureFlag =
  | 'shopify_commerce' // route commerce reads/cart through Shopify instead of local Postgres
  | 'ai_concierge' // AI Scent Concierge endpoints
  | 'concierge_v2' // Perfume Intelligence V2 endpoint and full-screen client
  | 'loyalty_rewards' // points redemption (financial): default OFF
  | 'referral_rewards' // referral payouts (financial): default OFF
  | 'sample_credits' // sample credit redemption: default OFF until priced
  | 'whatsapp_marketing' // promotional WhatsApp: requires consent + creds
  | 'agentic_feed' // expose machine-readable product feed for AI shopping channels
  | 'hero_orbit' // homepage orbital perfume carousel: default OFF until the merchant approves it

const DEFAULTS: Record<FeatureFlag, boolean> = {
  shopify_commerce: false,
  ai_concierge: true,
  concierge_v2: true,
  loyalty_rewards: false,
  referral_rewards: false,
  sample_credits: false,
  whatsapp_marketing: false,
  agentic_feed: false,
  hero_orbit: false,
}

function enabledSet(): Set<string> {
  return new Set(
    env.FEATURE_FLAGS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const set = enabledSet()
  if (set.has(flag)) return true
  if (set.has(`!${flag}`)) return false // explicit disable overrides default
  return DEFAULTS[flag]
}

export function allFlags(): Record<FeatureFlag, boolean> {
  return Object.fromEntries(
    (Object.keys(DEFAULTS) as FeatureFlag[]).map((f) => [f, isFeatureEnabled(f)]),
  ) as Record<FeatureFlag, boolean>
}
