/**
 * scripts/migrate/validate.ts
 * READ-ONLY migration validation + dry-run report. Safe to run any time. If DATABASE_URL is not
 * set, it no-ops gracefully (exit 0) so it can run in environments without a DB.
 *
 *   npx tsx scripts/migrate/validate.ts
 *
 * Checks: non-perfume products, duplicate SKUs, invalid currency, orphaned orders, products
 * missing required perfume attributes. Prints a migration report; exits non-zero on BLOCKING issues.
 */
import { PrismaClient } from '@prisma/client'

type Issue = { level: 'BLOCK' | 'WARN'; check: string; detail: string; count: number }

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[validate] DATABASE_URL not set — skipping DB checks (dry-run OK).')
    process.exit(0)
  }
  const prisma = new PrismaClient()
  const issues: Issue[] = []
  try {
    // 1. Non-perfume products (business is perfume-only)
    const nonPerfume = await prisma.product.count({ where: { NOT: { category: 'PERFUMES' } } })
    if (nonPerfume > 0)
      issues.push({ level: 'BLOCK', check: 'non_perfume_products', detail: 'Products with a non-PERFUMES category exist', count: nonPerfume })

    // 2. Duplicate SKUs (unique constraint should prevent, but check legacy data).
    //    Guarded: the `sku` column only exists AFTER the upgrade migration is applied.
    try {
      const dupSkus: Array<{ sku: string; c: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT "sku", COUNT(*) c FROM "Product" WHERE "sku" IS NOT NULL GROUP BY "sku" HAVING COUNT(*) > 1`,
      )
      if (dupSkus.length > 0)
        issues.push({ level: 'BLOCK', check: 'duplicate_sku', detail: 'Duplicate product SKUs', count: dupSkus.length })
    } catch {
      issues.push({ level: 'WARN', check: 'schema_pre_migration', detail: 'sku column absent — upgrade migration not yet applied to this DB', count: 0 })
    }

    // 3. Invalid currency
    const badCurrency = await prisma.product.count({ where: { NOT: { currency: 'NGN' } } })
    if (badCurrency > 0)
      issues.push({ level: 'WARN', check: 'non_ngn_currency', detail: 'Products not in NGN', count: badCurrency })

    // 4. Orphaned orders (userId with no matching user)
    const orphanOrders: Array<{ c: bigint }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) c FROM "Order" o LEFT JOIN "User" u ON o."userId" = u.id WHERE u.id IS NULL`,
    )
    const orphanCount = Number(orphanOrders[0]?.c ?? 0)
    if (orphanCount > 0)
      issues.push({ level: 'BLOCK', check: 'orphaned_orders', detail: 'Orders referencing a missing user', count: orphanCount })

    // 5. Products missing required perfume attributes (name/slug/price)
    const missingAttrs = await prisma.product.count({
      where: { OR: [{ name: '' }, { slug: '' }, { priceNGN: { lte: 0 } }] },
    })
    if (missingAttrs > 0)
      issues.push({ level: 'WARN', check: 'missing_attributes', detail: 'Products missing name/slug/valid price', count: missingAttrs })

    let publishedProducts = -1
    try {
      publishedProducts = await prisma.product.count({ where: { publishStatus: 'PUBLISHED' } })
    } catch {
      // publishStatus column not present pre-migration
    }
    const totals = {
      products: await prisma.product.count(),
      publishedProducts, // -1 means column not present (pre-migration)
      users: await prisma.user.count(),
      orders: await prisma.order.count(),
    }

    console.log('\n=== Migration Validation Report ===')
    console.log(JSON.stringify(totals, null, 2))
    if (issues.length === 0) {
      console.log('✅ No issues found.')
    } else {
      for (const i of issues) console.log(`[${i.level}] ${i.check}: ${i.detail} (count=${i.count})`)
    }

    const blocking = issues.filter((i) => i.level === 'BLOCK')
    process.exit(blocking.length > 0 ? 1 : 0)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('[validate] error:', e)
  process.exit(2)
})
