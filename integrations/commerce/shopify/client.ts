// integrations/commerce/shopify/client.ts
// Typed Shopify Storefront/Admin GraphQL client. Handles timeout, bounded retry with backoff,
// rate-limit (429 / throttled) awareness, and request correlation. Returns normalized errors.
// Active only when SHOPIFY_* env is configured; otherwise callers should not reach here (the
// registry defaults to the local provider).
import { env } from '@/lib/env'
import { AppError } from '@/lib/http/errors'
import { logger } from '@/lib/observability/logger'

const TIMEOUT_MS = 12_000
const MAX_RETRIES = 2

export type ShopifyApi = 'storefront' | 'admin'

function endpoint(api: ShopifyApi): string {
  const domain = env.SHOPIFY_STORE_DOMAIN
  const version = env.SHOPIFY_API_VERSION
  if (!domain) throw new AppError('FEATURE_DISABLED', { internal: 'SHOPIFY_STORE_DOMAIN missing' })
  return api === 'storefront'
    ? `https://${domain}/api/${version}/graphql.json`
    : `https://${domain}/admin/api/${version}/graphql.json`
}

function authHeaders(api: ShopifyApi): Record<string, string> {
  if (api === 'storefront') {
    const token = env.SHOPIFY_STOREFRONT_API_TOKEN
    if (!token) throw new AppError('FEATURE_DISABLED', { internal: 'SHOPIFY_STOREFRONT_API_TOKEN missing' })
    return { 'X-Shopify-Storefront-Access-Token': token }
  }
  const token = env.SHOPIFY_ADMIN_API_TOKEN
  if (!token) throw new AppError('FEATURE_DISABLED', { internal: 'SHOPIFY_ADMIN_API_TOKEN missing' })
  return { 'X-Shopify-Access-Token': token }
}

export async function shopifyGraphQL<T>(
  api: ShopifyApi,
  query: string,
  variables: Record<string, unknown> = {},
  correlationId?: string,
): Promise<T> {
  let attempt = 0
  while (true) {
    attempt++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(endpoint(api), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders(api) },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      })
      if (res.status === 429 || res.status >= 500) {
        if (attempt <= MAX_RETRIES) {
          const backoff = 250 * 2 ** (attempt - 1)
          await new Promise((r) => setTimeout(r, backoff))
          continue
        }
        throw new AppError('PROVIDER_ERROR', { internal: { status: res.status } })
      }
      const body = await res.json()
      if (body.errors?.length) {
        const throttled = JSON.stringify(body.errors).includes('THROTTLED')
        if (throttled && attempt <= MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * attempt))
          continue
        }
        logger.warn('shopify_graphql_errors', { correlationId, api })
        throw new AppError('PROVIDER_ERROR', { internal: body.errors })
      }
      return body.data as T
    } catch (e) {
      if (e instanceof AppError) throw e
      if ((e as Error).name === 'AbortError') {
        if (attempt <= MAX_RETRIES) continue
        throw new AppError('PROVIDER_TIMEOUT', { internal: 'shopify timeout' })
      }
      throw new AppError('PROVIDER_ERROR', { internal: e })
    } finally {
      clearTimeout(timer)
    }
  }
}
