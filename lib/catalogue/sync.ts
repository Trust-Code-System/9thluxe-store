// lib/catalogue/sync.ts
// Catalogue synchronization + validation. Pulls products from the active commerce provider (Shopify
// when configured + flagged, else local Postgres) and reconciles them into the Product table.
//  - Dry-run by default: reports created/updated/skipped without writing.
//  - Publishing rule: a product must have name, price>0 and at least one image to be PUBLISHED.
//  - Never invents data; missing external fields are left untouched.
import { prisma } from '@/lib/prisma'
import { getCommerce } from '@/integrations/registry'
import { writeAudit } from '@/lib/audit'
import { logger } from '@/lib/observability/logger'
import type { CommerceProduct } from '@/integrations/commerce/types'

export interface SyncIssue {
  slug: string
  issue: string
}

export interface SyncReport {
  provider: string
  apply: boolean
  scanned: number
  created: number
  updated: number
  skipped: number
  issues: SyncIssue[]
}

/** Publishing eligibility: real name, positive price, at least one image. */
export function isPublishable(p: { name: string; priceNGN: number; images: string[] }): boolean {
  return Boolean(p.name?.trim()) && p.priceNGN > 0 && p.images.length > 0
}

export async function syncCatalog(opts: { apply?: boolean; limit?: number } = {}): Promise<SyncReport> {
  const apply = opts.apply ?? false
  const provider = getCommerce()
  const report: SyncReport = { provider: provider.name, apply, scanned: 0, created: 0, updated: 0, skipped: 0, issues: [] }

  let cursor: string | null = null
  const pageSize = Math.min(opts.limit ?? 60, 60)

  do {
    const page = await provider.catalog.listProducts({ limit: pageSize, cursor: cursor ?? undefined })
    for (const cp of page.items) {
      report.scanned++
      const issue = await reconcileProduct(cp, apply, report)
      if (issue) report.issues.push(issue)
    }
    cursor = page.nextCursor
  } while (cursor && report.scanned < 1000)

  if (apply) {
    await writeAudit({ actorRole: 'ADMIN', action: 'catalogue.sync', targetType: 'Catalogue', metadata: { ...report, issues: report.issues.length } })
  }
  logger.info('catalogue_sync', { ...report, issues: report.issues.length })
  return report
}

async function reconcileProduct(cp: CommerceProduct, apply: boolean, report: SyncReport): Promise<SyncIssue | null> {
  const existing = await prisma.product.findFirst({
    where: cp.shopifyId ? { OR: [{ shopifyId: cp.shopifyId }, { slug: cp.slug }] } : { slug: cp.slug },
    select: { id: true, publishStatus: true },
  })

  if (!isPublishable({ name: cp.name, priceNGN: cp.price.amountNGN, images: cp.images })) {
    return { slug: cp.slug, issue: 'not_publishable_missing_name_price_or_image' }
  }

  if (!existing) {
    // Only the Shopify provider yields products not already in the DB; the local provider reads the DB.
    if (apply && provider() === 'shopify') {
      await prisma.product.create({
        data: {
          name: cp.name,
          slug: cp.slug,
          description: cp.description || cp.name,
          images: cp.images,
          priceNGN: cp.price.amountNGN,
          currency: cp.price.currency,
          category: 'PERFUMES',
          brand: cp.brand,
          shopifyId: cp.shopifyId,
          publishStatus: 'PUBLISHED',
          stock: cp.variants[0]?.availableQuantity ?? 0,
        },
      })
      report.created++
    } else {
      report.skipped++
    }
    return null
  }

  if (apply) {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        priceNGN: cp.price.amountNGN,
        // Auto-publish once eligible; never auto-archive a published item during sync.
        publishStatus: existing.publishStatus === 'ARCHIVED' ? 'ARCHIVED' : 'PUBLISHED',
      },
    })
    report.updated++
  } else {
    report.skipped++
  }
  return null
}

function provider(): string {
  return getCommerce().name
}
