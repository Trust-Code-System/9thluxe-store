// lib/migrate/checks.ts
// PURE migration validation rules, extracted from scripts/migrate/validate.ts so they can be unit
// tested without a database. Each returns structured issues; the script wraps these around live
// queries. No data is mutated here; validation only.

export type IssueLevel = 'BLOCK' | 'WARN'
export interface CheckIssue {
  level: IssueLevel
  check: string
  detail: string
  count: number
}

export interface ProductRow {
  id: string
  name: string
  slug: string
  priceNGN: number
  currency: string
  category: string
  sku?: string | null
}

export const ALLOWED_CATEGORIES = ['PERFUMES']

/** Detect products in an unsupported (non-perfume) category. */
export function checkUnsupportedCategory(products: ProductRow[]): CheckIssue | null {
  const bad = products.filter((p) => !ALLOWED_CATEGORIES.includes(p.category))
  return bad.length ? { level: 'BLOCK', check: 'unsupported_category', detail: 'Products with a non-PERFUMES category', count: bad.length } : null
}

/** Detect products missing required attributes (name/slug/valid price). */
export function checkMissingAttributes(products: ProductRow[]): CheckIssue | null {
  const bad = products.filter((p) => !p.name?.trim() || !p.slug?.trim() || !(p.priceNGN > 0))
  return bad.length ? { level: 'WARN', check: 'missing_attributes', detail: 'Products missing name/slug/valid price', count: bad.length } : null
}

/** Detect products not priced in an accepted currency. */
export function checkInvalidCurrency(products: ProductRow[], accepted = ['NGN']): CheckIssue | null {
  const bad = products.filter((p) => !accepted.includes(p.currency))
  return bad.length ? { level: 'WARN', check: 'invalid_currency', detail: 'Products not in an accepted currency', count: bad.length } : null
}

/** Detect duplicate SKUs (case-insensitive, ignoring null/empty). */
export function checkDuplicateSkus(products: ProductRow[]): CheckIssue | null {
  const counts = new Map<string, number>()
  for (const p of products) {
    if (!p.sku) continue
    const key = p.sku.trim().toUpperCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const dups = [...counts.values()].filter((c) => c > 1).length
  return dups ? { level: 'BLOCK', check: 'duplicate_sku', detail: 'Duplicate product SKUs', count: dups } : null
}

/** Detect orders referencing a user id that does not exist (orphaned records). */
export function checkOrphanedOrders(orderUserIds: string[], existingUserIds: Set<string>): CheckIssue | null {
  const orphans = orderUserIds.filter((uid) => !existingUserIds.has(uid)).length
  return orphans ? { level: 'BLOCK', check: 'orphaned_orders', detail: 'Orders referencing a missing user', count: orphans } : null
}

/** Aggregate all product-level + relational checks into a single report. */
export function runAllChecks(input: {
  products: ProductRow[]
  orderUserIds: string[]
  existingUserIds: Set<string>
}): { issues: CheckIssue[]; blocking: boolean } {
  const issues = [
    checkUnsupportedCategory(input.products),
    checkMissingAttributes(input.products),
    checkInvalidCurrency(input.products),
    checkDuplicateSkus(input.products),
    checkOrphanedOrders(input.orderUserIds, input.existingUserIds),
  ].filter((i): i is CheckIssue => i != null)
  return { issues, blocking: issues.some((i) => i.level === 'BLOCK') }
}
