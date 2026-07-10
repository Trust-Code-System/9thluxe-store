// integrations/search/postgres.ts
// Postgres search provider. Uses Prisma against the perfume catalogue with deterministic hard
// filters. Text matching uses case-insensitive `contains` across name/brand/description/notes;
// this can be upgraded to tsvector/pg_trgm indexes (see docs/SEARCH_ARCHITECTURE.md) without
// changing this interface. Availability/price/sample facets are applied as hard filters.
import { prisma } from '@/lib/prisma'
import type { SearchProvider, SearchQuery, SearchResult, SearchHit } from './types'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

export const postgresSearch: SearchProvider = {
  name: 'postgres',
  async search(query: SearchQuery): Promise<SearchResult> {
    const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
    const f = query.filters ?? {}
    const q = query.q?.trim()

    const and: any[] = [{ deletedAt: null }]
    if (f.brand) and.push({ brand: { equals: f.brand, mode: 'insensitive' } })
    if (f.family) and.push({ fragranceFamily: { equals: f.family, mode: 'insensitive' } })
    if (f.occasion) and.push({ occasion: { contains: f.occasion, mode: 'insensitive' } })
    if (f.inStock) and.push({ stock: { gt: 0 } })
    if (typeof f.minPriceNGN === 'number') and.push({ priceNGN: { gte: f.minPriceNGN } })
    if (typeof f.maxPriceNGN === 'number') and.push({ priceNGN: { lte: f.maxPriceNGN } })
    if (f.note) {
      and.push({
        OR: [
          { notesTop: { contains: f.note, mode: 'insensitive' } },
          { notesHeart: { contains: f.note, mode: 'insensitive' } },
          { notesBase: { contains: f.note, mode: 'insensitive' } },
        ],
      })
    }
    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { notesTop: { contains: q, mode: 'insensitive' } },
          { notesHeart: { contains: q, mode: 'insensitive' } },
          { notesBase: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    const where = { AND: and }
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }, { createdAt: 'desc' }],
        take: limit + 1,
        select: { id: true, slug: true, name: true, brand: true, priceNGN: true, stock: true, ratingAvg: true },
      }),
      prisma.product.count({ where }),
    ])

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const hits: SearchHit[] = page.map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      priceNGN: p.priceNGN,
      inStock: p.stock > 0,
      score: p.ratingAvg ?? 0,
    }))
    return { hits, total, nextCursor: hasMore ? page[page.length - 1].id : null }
  },
}
