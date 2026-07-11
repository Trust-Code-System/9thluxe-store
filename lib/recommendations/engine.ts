// lib/recommendations/engine.ts
// Catalogue-grounded recommendation engine. Dependencies are injected so it is testable without a
// database or network. The pipeline guarantees the core invariant: a product is never returned as
// available unless it is real, in-catalogue, and in stock (or explicitly labelled preorder/waitlist).
//
//   intent -> hard constraints -> retrieve (search) -> validate -> score -> revalidate -> typed results
import type { CommerceCatalogService, CommerceProduct } from '@/integrations/commerce/types'
import type { SearchProvider } from '@/integrations/search/types'
import type { AiServices } from '@/integrations/ai/types'
import { rankCandidates, type Candidate, type Constraints } from './scoring'

export interface RecommendInput {
  query?: string
  includeNotes?: string[]
  excludeNotes?: string[]
  budgetMaxNGN?: number | null
  family?: string | null
  occasion?: string | null
  climate?: string | null
  preferSample?: boolean
  ownedIds?: string[]
  limit?: number
}

export interface RecommendationItem {
  product: CommerceProduct
  score: number
  reasons: string[]
  /** Availability label the frontend must honour. */
  availability: 'in_stock' | 'preorder' | 'waitlist'
  merchandisingApplied: boolean
}

export interface RecommendationResult {
  items: RecommendationItem[]
  constraints: Constraints
  explanation: string | null
  /** Present when the request cannot be grounded in the catalogue. */
  unsupportedReason?: string
  disclaimer: string
}

export interface EngineDeps {
  search: SearchProvider
  catalog: CommerceCatalogService
  ai: AiServices
}

const DISCLAIMER =
  'Recommendations are based on our catalogue and aggregated customer opinion, not medical or allergy advice.'

function productToCandidate(p: CommerceProduct): Candidate {
  const notes = [p.notesTop, p.notesHeart, p.notesBase]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean)
  return {
    id: p.id,
    priceNGN: p.price.amountNGN,
    inStock: p.inStock,
    fragranceFamily: p.fragranceFamily,
    notes,
    occasion: null,
    climate: null,
    intensity: null,
    longevity: p.longevity,
    sampleAvailable: p.variants.some((v) => v.sampleSize && v.inStock),
    merchandisingWeight: undefined,
  }
}

/**
 * Produce grounded recommendations. `ai.classifyIntent` is best-effort: if it fails, we fall back to
 * the explicit input. Retrieval + hard filtering happen in the search provider; scoring only ranks
 * the validated set; a final revalidation pass drops anything no longer available.
 */
export async function recommend(input: RecommendInput, deps: EngineDeps): Promise<RecommendationResult> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 20)

  // 1-2. Intent -> constraints (explicit input always wins over inferred).
  let inferred: Partial<Constraints> = {}
  if (input.query) {
    try {
      const intent = await deps.ai.classifyIntent({ message: input.query })
      if (intent.intent === 'unsupported') {
        return {
          items: [],
          constraints: {},
          explanation: null,
          unsupportedReason: 'That request is outside our fragrance catalogue.',
          disclaimer: DISCLAIMER,
        }
      }
      inferred = {
        includeNotes: intent.includeNotes,
        excludeNotes: intent.excludeNotes,
        budgetMaxNGN: intent.budgetMaxNGN,
        occasion: intent.occasion,
        climate: intent.climate,
        preferSample: intent.intent === 'sample_first',
      }
    } catch {
      // fall back to explicit input only
    }
  }

  const constraints: Constraints = {
    includeNotes: input.includeNotes ?? inferred.includeNotes ?? [],
    excludeNotes: input.excludeNotes ?? inferred.excludeNotes ?? [],
    budgetMaxNGN: input.budgetMaxNGN ?? inferred.budgetMaxNGN ?? null,
    family: input.family ?? inferred.family ?? null,
    occasion: input.occasion ?? inferred.occasion ?? null,
    climate: input.climate ?? inferred.climate ?? null,
    preferSample: input.preferSample ?? inferred.preferSample ?? false,
    ownedIds: input.ownedIds ?? [],
  }

  // 3. Retrieve with HARD filters (in-catalogue, in-stock unless sample-first, within budget).
  //    Note: we do NOT pass the raw natural-language sentence to the provider's substring `q`, that
  //    matches almost nothing. We retrieve by structured filters + a short keyword (a matched note or
  //    a 1-2 word query), then fall back to a filtered listing so there are always candidates to rank.
  const wantN = limit * 4
  const sharedFilters = {
    family: constraints.family ?? undefined,
    occasion: constraints.occasion ?? undefined,
    inStock: !constraints.preferSample ? true : undefined,
    maxPriceNGN: constraints.budgetMaxNGN ?? undefined,
  }
  const shortQuery = input.query && input.query.trim().split(/\s+/).length <= 2 ? input.query.trim() : undefined
  const keyword = constraints.includeNotes?.[0] ?? shortQuery

  const search = await deps.search.search({
    q: keyword,
    filters: { ...sharedFilters, note: constraints.includeNotes?.[0] },
    limit: wantN,
  })

  const ids = new Set(search.hits.map((h) => h.productId))
  // Fallback: fill candidates from a filtered listing when retrieval is thin (e.g. weak note extraction).
  if (ids.size < limit) {
    const page = await deps.catalog.listProducts({ ...sharedFilters, limit: wantN })
    for (const p of page.items) ids.add(p.id)
  }

  // 4. Load full products (source of truth for price/stock/notes), never trust the search cache alone.
  const products = (
    await Promise.all([...ids].map((id) => deps.catalog.getProductById(id)))
  ).filter((p): p is CommerceProduct => p !== null)

  // 5-6. Score + rank the validated candidate set.
  const candidates = products.map((p) => productToCandidate(p))
  const ranked = rankCandidates(candidates, constraints)
  const byId = new Map(products.map((p) => [p.id, p]))

  // 7-9. Revalidate availability at return time and map to typed results.
  const items: RecommendationItem[] = []
  for (const r of ranked) {
    const p = byId.get(r.id)
    if (!p) continue
    const available = p.inStock
    const isPreorder = (p as unknown as { isPreorder?: boolean }).isPreorder === true
    if (!available && !constraints.preferSample && !isPreorder) continue // never present unavailable as available
    items.push({
      product: p,
      score: r.score,
      reasons: r.reasons,
      availability: available ? 'in_stock' : isPreorder ? 'preorder' : 'waitlist',
      merchandisingApplied: r.merchandisingApplied,
    })
    if (items.length >= limit) break
  }

  // 10. Best-effort natural-language explanation (never blocks results).
  let explanation: string | null = null
  if (items.length > 0) {
    try {
      const res = await deps.ai.explainRecommendation({
        query: input.query ?? '',
        products: items.map((i) => ({
          name: i.product.name,
          notesTop: i.product.notesTop,
          notesHeart: i.product.notesHeart,
          notesBase: i.product.notesBase,
        })),
      })
      explanation = res.explanation
    } catch {
      explanation = null
    }
  }

  return { items, constraints, explanation, disclaimer: DISCLAIMER }
}
