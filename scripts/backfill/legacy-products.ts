/**
 * scripts/backfill/legacy-products.ts
 * One-off, idempotent backfill for products that predate the perfume-schema upgrade: publishes the
 * live catalogue and fills fragrance metadata for the known seed products. Safe to re-run.
 *
 *   npx tsx scripts/backfill/legacy-products.ts
 *
 * Only updates named slugs + flips DRAFT -> PUBLISHED for non-deleted products. No deletes.
 */
import { PrismaClient, PublishStatus } from '@prisma/client'

const prisma = new PrismaClient()

const ENRICH: Array<{
  slug: string
  fragranceFamily: string
  concentration: string
  notesTop: string
  notesHeart: string
  notesBase: string
}> = [
  { slug: 'nocturne-eau-de-parfum', fragranceFamily: 'ORIENTAL', concentration: 'EDP', notesTop: 'bergamot', notesHeart: 'oud', notesBase: 'amber, vanilla' },
  { slug: 'aurelius-noir-eau-de-toilette', fragranceFamily: 'WOODY', concentration: 'EDT', notesTop: 'lemon, bergamot', notesHeart: 'cedar', notesBase: 'vetiver' },
  { slug: 'vesper-velvet-eau-de-parfum', fragranceFamily: 'FLORAL', concentration: 'EDP', notesTop: 'pink pepper', notesHeart: 'rose', notesBase: 'patchouli' },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[backfill] DATABASE_URL not set — nothing to do.')
    return
  }
  let enriched = 0
  for (const e of ENRICH) {
    const res = await prisma.product.updateMany({
      where: { slug: e.slug },
      data: {
        fragranceFamily: e.fragranceFamily,
        concentration: e.concentration,
        notesTop: e.notesTop,
        notesHeart: e.notesHeart,
        notesBase: e.notesBase,
        publishStatus: PublishStatus.PUBLISHED,
      },
    })
    enriched += res.count
    console.log(`[backfill] ${e.slug}: updated ${res.count}`)
  }

  // Publish any remaining non-deleted DRAFT products (they are the live catalogue).
  const published = await prisma.product.updateMany({
    where: { publishStatus: PublishStatus.DRAFT, deletedAt: null },
    data: { publishStatus: PublishStatus.PUBLISHED },
  })

  const total = await prisma.product.count({ where: { deletedAt: null } })
  const publishedCount = await prisma.product.count({ where: { publishStatus: PublishStatus.PUBLISHED, deletedAt: null } })
  console.log(`[backfill] enriched=${enriched}, newly-published=${published.count}, published/total=${publishedCount}/${total}`)
  console.log('✅ Backfill complete.')
}

main()
  .catch((e) => {
    console.error('[backfill] error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
