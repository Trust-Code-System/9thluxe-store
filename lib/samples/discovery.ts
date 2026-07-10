// lib/samples/discovery.ts
// PURE validation + pricing for build-your-own discovery sets. Selection-count rules come from
// commerce config (not hard-coded). Stock validation is performed by the caller against the DB;
// this module handles rules + pricing deterministically so it is unit-testable.
import { getCommerceConfig } from '@/lib/config/commerce'

export interface DiscoveryItemInput {
  productId: string
  variantId?: string | null
  unitPriceNGN: number
  quantity: number
}

export interface DiscoveryValidation {
  ok: boolean
  errorCode?: 'CART_INVALID'
  message?: string
  totalItems: number
  subtotalNGN: number
}

/** Validate selection-count rules and compute the subtotal for a discovery set. */
export function validateDiscoverySet(items: DiscoveryItemInput[]): DiscoveryValidation {
  const { discovery } = getCommerceConfig()
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotalNGN = items.reduce((s, i) => s + i.unitPriceNGN * i.quantity, 0)

  if (items.some((i) => i.quantity <= 0 || !Number.isInteger(i.quantity))) {
    return { ok: false, errorCode: 'CART_INVALID', message: 'Each selection needs a positive quantity.', totalItems, subtotalNGN }
  }
  if (totalItems < discovery.minItems) {
    return {
      ok: false,
      errorCode: 'CART_INVALID',
      message: `Choose at least ${discovery.minItems} samples.`,
      totalItems,
      subtotalNGN,
    }
  }
  if (totalItems > discovery.maxItems) {
    return {
      ok: false,
      errorCode: 'CART_INVALID',
      message: `A discovery set can hold at most ${discovery.maxItems} samples.`,
      totalItems,
      subtotalNGN,
    }
  }
  return { ok: true, totalItems, subtotalNGN }
}
