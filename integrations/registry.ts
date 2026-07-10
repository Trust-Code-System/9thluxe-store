// integrations/registry.ts
// Single place that selects concrete providers from env + feature flags. Application/service code
// calls getCommerce()/getPayments()/getSearch()/getAi()/getNotifier() — never a specific adapter.
import { env } from '@/lib/env'
import { isFeatureEnabled } from '@/lib/config/feature-flags'
import type { CommerceProvider } from './commerce/types'
import { localCommerce } from './commerce/local'
import { shopifyCommerce } from './commerce/shopify'
import type { PaymentProvider } from './payments/types'
import { paystackProvider } from './payments/paystack'
import { mockPaymentProvider } from './payments/mock'
import type { SearchProvider } from './search/types'
import { postgresSearch } from './search/postgres'
import { aiServices } from './ai'
import type { AiServices } from './ai/types'

export function getCommerce(): CommerceProvider {
  const shopifyConfigured = Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_API_TOKEN)
  if (shopifyConfigured && isFeatureEnabled('shopify_commerce')) return shopifyCommerce
  return localCommerce
}

export function getPayments(): PaymentProvider {
  // Live Paystack only when a secret key is present; otherwise the deterministic mock (dev/test).
  return env.PAYSTACK_SECRET_KEY ? paystackProvider : mockPaymentProvider
}

export function getSearch(): SearchProvider {
  return postgresSearch
}

export function getAi(): AiServices {
  return aiServices
}

/** Which providers are active — safe to expose to admins for the integration status panel. */
export function providerStatus() {
  return {
    commerce: getCommerce().name,
    payments: getPayments().name,
    search: getSearch().name,
    ai: env.AI_PROVIDER,
  }
}
