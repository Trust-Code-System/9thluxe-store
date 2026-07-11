// lib/catalogue/inventory.ts
// Inventory service. Source of truth for stock is the local Postgres `Product.stock` column (see
// docs/SHOPIFY_INTEGRATION.md; when Shopify is enabled it becomes authoritative and syncs here).
// Setting stock from 0 -> positive fires back-in-stock notifications to waiting subscribers.
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'
import { logger } from '@/lib/observability/logger'
import { dispatchNotificationEvent } from '@/lib/notifications/dispatch'

/** Set absolute stock for a product. Triggers back-in-stock processing on a 0 -> positive edge. */
export async function setStock(productId: string, newStock: number, actorId?: string) {
  if (!Number.isInteger(newStock) || newStock < 0) throw new AppError('VALIDATION_ERROR', { message: 'stock must be a non-negative integer.' })
  const before = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true, name: true } })
  if (!before) throw new AppError('PRODUCT_NOT_FOUND')

  const updated = await prisma.product.update({ where: { id: productId }, data: { stock: newStock }, select: { stock: true } })
  await writeAudit({ actorId, actorRole: actorId ? 'ADMIN' : 'SYSTEM', action: 'inventory.set_stock', targetType: 'Product', targetId: productId, metadata: { from: before.stock, to: newStock } })

  let notified = 0
  if (before.stock <= 0 && newStock > 0) {
    notified = await processBackInStock(productId, before.name)
  }
  return { stock: updated.stock, backInStockNotified: notified }
}

/** Notify all un-notified back-in-stock subscribers for a product. Idempotent per subscriber. */
export async function processBackInStock(productId: string, productName?: string): Promise<number> {
  const subs = await prisma.backInStockSubscription.findMany({
    where: { productId, notified: false },
    select: { id: true, email: true, userId: true },
  })
  if (subs.length === 0) return 0
  const name = productName ?? (await prisma.product.findUnique({ where: { id: productId }, select: { name: true } }))?.name ?? 'A fragrance'

  let count = 0
  for (const sub of subs) {
    await dispatchNotificationEvent({
      event: 'back_in_stock',
      dedupeKey: `back_in_stock:${productId}:${sub.email}`,
      to: { email: sub.email, userId: sub.userId ?? undefined },
      data: { productName: name, productId },
    })
    await prisma.backInStockSubscription.update({ where: { id: sub.id }, data: { notified: true, notifiedAt: new Date() } })
    count++
  }
  logger.info('back_in_stock_processed', { productId, notified: count })
  return count
}

export interface DuplicateSku {
  sku: string
  productIds: string[]
}

/** Detect products sharing a SKU (data-quality guard for catalogue sync). */
export async function detectDuplicateSkus(): Promise<DuplicateSku[]> {
  const grouped = await prisma.product.groupBy({
    by: ['sku'],
    where: { sku: { not: null }, deletedAt: null },
    _count: { sku: true },
    having: { sku: { _count: { gt: 1 } } },
  })
  const dups: DuplicateSku[] = []
  for (const g of grouped) {
    if (!g.sku) continue
    const rows = await prisma.product.findMany({ where: { sku: g.sku, deletedAt: null }, select: { id: true } })
    dups.push({ sku: g.sku, productIds: rows.map((r) => r.id) })
  }
  return dups
}

export interface InventoryHealth {
  outOfStock: Array<{ id: string; name: string }>
  reorderNeeded: Array<{ id: string; name: string; stock: number; reorderPoint: number }>
  deadStock: Array<{ id: string; name: string; stock: number }>
  duplicateSkus: DuplicateSku[]
}

const DEAD_STOCK_DAYS = 90

/** Inventory-health report: out-of-stock, at/below reorder point, and slow-moving (dead) stock. */
export async function inventoryHealth(): Promise<InventoryHealth> {
  const deadSince = new Date(Date.now() - DEAD_STOCK_DAYS * 24 * 60 * 60 * 1000)

  const [products, soldRecently] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, stock: true, reorderPoint: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: deadSince }, status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } } },
      select: { productId: true },
      distinct: ['productId'],
    }),
  ])
  const soldSet = new Set(soldRecently.map((s) => s.productId))

  const outOfStock: InventoryHealth['outOfStock'] = []
  const reorderNeeded: InventoryHealth['reorderNeeded'] = []
  const deadStock: InventoryHealth['deadStock'] = []
  for (const p of products) {
    if (p.stock <= 0) outOfStock.push({ id: p.id, name: p.name })
    const rp = p.reorderPoint ?? 0
    if (rp > 0 && p.stock <= rp && p.stock > 0) reorderNeeded.push({ id: p.id, name: p.name, stock: p.stock, reorderPoint: rp })
    if (p.stock > 0 && !soldSet.has(p.id)) deadStock.push({ id: p.id, name: p.name, stock: p.stock })
  }

  return { outOfStock, reorderNeeded, deadStock, duplicateSkus: await detectDuplicateSkus() }
}
