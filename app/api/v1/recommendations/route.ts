// app/api/v1/recommendations/route.ts
// GET /api/v1/recommendations: catalogue-grounded recommendations. Never returns an unavailable
// product as available (enforced by the engine).
import { route } from '@/lib/http/handler'
import { getSearch, getCommerce, getAi } from '@/integrations/registry'
import { recommend, type RecommendInput } from '@/lib/recommendations/engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csv(v: string | null): string[] | undefined {
  if (!v) return undefined
  const parts = v.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts : undefined
}

export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams
  const budget = sp.get('budgetMaxNGN')
  const input: RecommendInput = {
    query: sp.get('q') ?? undefined,
    includeNotes: csv(sp.get('notes')),
    excludeNotes: csv(sp.get('excludeNotes')),
    budgetMaxNGN: budget ? Number(budget) : undefined,
    family: sp.get('family') ?? undefined,
    occasion: sp.get('occasion') ?? undefined,
    climate: sp.get('climate') ?? undefined,
    preferSample: sp.get('sampleFirst') === 'true',
    limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
  }
  const result = await recommend(input, {
    search: getSearch(),
    catalog: getCommerce().catalog,
    ai: getAi(),
  })
  return {
    data: {
      items: result.items,
      explanation: result.explanation,
      constraints: result.constraints,
      unsupportedReason: result.unsupportedReason ?? null,
      disclaimer: result.disclaimer,
    },
    meta: { count: result.items.length },
  }
})
