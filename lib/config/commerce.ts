// lib/config/commerce.ts
// Central commerce policy configuration. NO policy value (shipping threshold, fees, currency,
// loyalty tiers) may be hard-coded elsewhere — read it from here so the owner can change policy
// without code edits, and so tests can override it.
import { env } from '@/lib/env'

export interface ShippingPolicy {
  currency: string
  freeShippingThreshold: number // in minor-unit-free NGN (whole naira), as used across the app
  flatShippingFee: number
}

export interface LoyaltyTier {
  key: 'STANDARD' | 'OBSIDIAN' | 'GOLD' | 'PLATINUM'
  minLifetimeSpend: number
}

export interface DiscoveryPolicy {
  minItems: number
  maxItems: number
}

export interface CommerceConfig {
  shipping: ShippingPolicy
  /** Tiers ordered ascending by threshold. Money values only; rewards stay disabled until approved. */
  loyaltyTiers: LoyaltyTier[]
  supportedCurrencies: string[]
  discovery: DiscoveryPolicy
}

export function getCommerceConfig(): CommerceConfig {
  return {
    shipping: {
      currency: env.COMMERCE_CURRENCY,
      freeShippingThreshold: env.COMMERCE_FREE_SHIPPING_THRESHOLD_NGN,
      flatShippingFee: env.COMMERCE_FLAT_SHIPPING_NGN,
    },
    // Preserves the thresholds already present in the Paystack webhook, now as config.
    loyaltyTiers: [
      { key: 'STANDARD', minLifetimeSpend: 0 },
      { key: 'OBSIDIAN', minLifetimeSpend: 200_000 },
      { key: 'GOLD', minLifetimeSpend: 1_000_000 },
      { key: 'PLATINUM', minLifetimeSpend: 5_000_000 },
    ],
    supportedCurrencies: [env.COMMERCE_CURRENCY],
    discovery: { minItems: 3, maxItems: 8 },
  }
}

/** Shipping fee for a given subtotal, per the configured policy. */
export function computeShipping(subtotalNGN: number): number {
  const { shipping } = getCommerceConfig()
  if (subtotalNGN >= shipping.freeShippingThreshold) return 0
  return shipping.flatShippingFee
}

/** Resolve loyalty tier for a lifetime spend using configured thresholds. */
export function resolveLoyaltyTier(lifetimeSpendNGN: number): LoyaltyTier['key'] {
  const tiers = getCommerceConfig().loyaltyTiers
  let current: LoyaltyTier['key'] = 'STANDARD'
  for (const t of tiers) {
    if (lifetimeSpendNGN >= t.minLifetimeSpend) current = t.key
  }
  return current
}

export function isSupportedCurrency(currency: string): boolean {
  return getCommerceConfig().supportedCurrencies.includes(currency.toUpperCase())
}
