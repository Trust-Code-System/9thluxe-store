// app/api/v1/products/route.ts
// GET /api/v1/products — envelope-wrapped, catalogue-provider-backed product listing.
import { route } from '@/lib/http/handler'
import { getCommerce } from '@/integrations/registry'
import type { CatalogQuery } from '@/integrations/commerce/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function num(v: string | null): number | undefined {
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  const query: CatalogQuery = {
    q: sp.get('q') ?? undefined,
    brand: sp.get('brand') ?? undefined,
    family: sp.get('family') ?? undefined,
    note: sp.get('note') ?? undefined,
    occasion: sp.get('occasion') ?? undefined,
    inStock: sp.get('inStock') === 'true' ? true : undefined,
    minPriceNGN: num(sp.get('minPriceNGN')),
    maxPriceNGN: num(sp.get('maxPriceNGN')),
    cursor: sp.get('cursor') ?? undefined,
    limit: num(sp.get('limit')),
  }
  const page = await getCommerce().catalog.listProducts(query)
  return {
    data: { products: page.items, nextCursor: page.nextCursor },
    meta: { count: page.items.length },
  }
})
