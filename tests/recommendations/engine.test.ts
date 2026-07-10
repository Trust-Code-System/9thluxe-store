import { describe, it, expect } from 'vitest'
import { recommend, type EngineDeps } from '@/lib/recommendations/engine'
import type { CommerceProduct } from '@/integrations/commerce/types'
import type { AiServices, IntentResult } from '@/integrations/ai/types'

function product(over: Partial<CommerceProduct> & { id: string }): CommerceProduct {
  return {
    id: over.id,
    shopifyId: null,
    slug: over.slug ?? over.id,
    name: over.name ?? over.id,
    brand: over.brand ?? 'Fàdè',
    description: '',
    price: over.price ?? { amountNGN: 80_000, currency: 'NGN' },
    compareAtPrice: null,
    images: [],
    fragranceFamily: over.fragranceFamily ?? 'WOODY',
    notesTop: over.notesTop ?? 'bergamot',
    notesHeart: over.notesHeart ?? 'oud',
    notesBase: over.notesBase ?? 'amber',
    concentration: 'EDP',
    longevity: 'long',
    sillage: 'strong',
    ratingAvg: 4.5,
    ratingCount: 10,
    inStock: over.inStock ?? true,
    isNew: false,
    isBestseller: false,
    isLimited: false,
    variants: over.variants ?? [],
  }
}

function makeDeps(products: CommerceProduct[], intent?: Partial<IntentResult>): EngineDeps {
  const byId = new Map(products.map((p) => [p.id, p]))
  const ai: AiServices = {
    async classifyIntent(): Promise<IntentResult> {
      return {
        intent: (intent?.intent as IntentResult['intent']) ?? 'recommend',
        budgetMaxNGN: intent?.budgetMaxNGN ?? null,
        includeNotes: intent?.includeNotes ?? [],
        excludeNotes: intent?.excludeNotes ?? [],
        occasion: intent?.occasion ?? null,
        climate: intent?.climate ?? null,
      }
    },
    async explainRecommendation() {
      return { explanation: 'because notes match' }
    },
    async answerSupport() {
      return { answer: '', escalate: false }
    },
    async summarizeReviews() {
      return { summary: '', reviewsSummarized: 0, isAiSummary: true }
    },
    async draftMarketing() {
      return { draft: '' }
    },
    async ownerBrief() {
      return { summary: '', actions: [] }
    },
  }
  return {
    ai,
    search: {
      name: 'postgres',
      async search() {
        return {
          hits: products.map((p) => ({
            productId: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            priceNGN: p.price.amountNGN,
            inStock: p.inStock,
            score: 1,
          })),
          total: products.length,
          nextCursor: null,
        }
      },
    },
    catalog: {
      async listProducts() {
        return { items: products, nextCursor: null }
      },
      async getProductBySlug(slug) {
        return products.find((p) => p.slug === slug) ?? null
      },
      async getProductById(id) {
        return byId.get(id) ?? null
      },
      async listCollections() {
        return []
      },
    },
  }
}

describe('recommendation engine — grounding invariant', () => {
  it('never returns an out-of-stock product as available', async () => {
    const products = [
      product({ id: 'in', inStock: true }),
      product({ id: 'out', inStock: false }),
    ]
    const result = await recommend({ query: 'something woody' }, makeDeps(products))
    const ids = result.items.map((i) => i.product.id)
    expect(ids).toContain('in')
    expect(ids).not.toContain('out')
    expect(result.items.every((i) => i.availability === 'in_stock')).toBe(true)
  })

  it('honours excluded notes as a hard constraint', async () => {
    const products = [
      product({ id: 'has-oud', notesHeart: 'oud' }),
      product({ id: 'no-oud', notesTop: 'lemon', notesHeart: 'cedar', notesBase: 'vetiver' }),
    ]
    const result = await recommend({ query: 'woody', excludeNotes: ['oud'] }, makeDeps(products))
    const ids = result.items.map((i) => i.product.id)
    expect(ids).not.toContain('has-oud')
    expect(ids).toContain('no-oud')
  })

  it('returns an unsupported reason for out-of-catalogue intent', async () => {
    const result = await recommend({ query: 'fix my car' }, makeDeps([], { intent: 'unsupported' }))
    expect(result.unsupportedReason).toBeTruthy()
    expect(result.items).toHaveLength(0)
  })

  it('drops products over the stated budget', async () => {
    const products = [
      product({ id: 'cheap', price: { amountNGN: 40_000, currency: 'NGN' } }),
      product({ id: 'pricey', price: { amountNGN: 300_000, currency: 'NGN' } }),
    ]
    const result = await recommend({ query: 'woody', budgetMaxNGN: 100_000 }, makeDeps(products))
    const ids = result.items.map((i) => i.product.id)
    expect(ids).toContain('cheap')
    expect(ids).not.toContain('pricey')
  })
})
