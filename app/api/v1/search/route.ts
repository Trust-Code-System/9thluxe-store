// app/api/v1/search/route.ts
// GET /api/v1/search — faceted search (hard filters applied in the provider before any ranking).
import { route } from '@/lib/http/handler'
import { getSearch } from '@/integrations/registry'
import type { SearchFilters } from '@/integrations/search/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function num(v: string | null): number | undefined {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  const filters: SearchFilters = {
    brand: sp.get('brand') ?? undefined,
    family: sp.get('family') ?? undefined,
    note: sp.get('note') ?? undefined,
    occasion: sp.get('occasion') ?? undefined,
    inStock: sp.get('inStock') === 'true' ? true : undefined,
    sampleAvailable: sp.get('sampleAvailable') === 'true' ? true : undefined,
    minPriceNGN: num(sp.get('minPriceNGN')),
    maxPriceNGN: num(sp.get('maxPriceNGN')),
  }
  const result = await getSearch().search({
    q: sp.get('q') ?? undefined,
    filters,
    limit: num(sp.get('limit')),
    cursor: sp.get('cursor') ?? undefined,
  })
  return {
    data: { hits: result.hits, nextCursor: result.nextCursor },
    meta: { total: result.total },
  }
})
